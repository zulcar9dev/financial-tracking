-- ============================================================
-- Scheduler: notifikasi in-app recurring & ambang anggaran
--
-- Dipanggil oleh edge function `schedule-recurring-reminders`
-- (dijadwalkan via `schedules`, harian). SECURITY DEFINER agar
-- bisa menulis notification_jobs untuk semua pengguna tanpa RLS.
-- Idempotent: dedupe_key unik per (user, peristiwa, ambang) dan
-- INSERT ... ON CONFLICT DO NOTHING. Aman dipicu berulang kali.
--
-- Logika mengikuti mesin app:
--  - lib/budget.ts computeBudgets (threshold 80% / 100% / over)
--  - lib/actions/recurring.ts computeNextOccurrence (via next_occurrence_at)
-- ============================================================

CREATE OR REPLACE FUNCTION public.scheduler_generate_notification_jobs()
RETURNS TABLE (recurring_reminders BIGINT, budget_alerts BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH due AS (
    SELECT t.id, t.user_id, t.name, t.transaction_type, t.amount_idr,
           t.next_occurrence_at AS due_at,
           COALESCE(t.reminder_offsets, '[1440]'::jsonb) AS offsets
    FROM recurring_templates t
    JOIN notification_preferences p ON p.user_id = t.user_id
    WHERE t.is_active
      AND p.in_app_enabled
      AND p.recurring_reminder_enabled
      AND t.next_occurrence_at > NOW()
      AND (t.end_date IS NULL OR t.end_date >= CURRENT_DATE)
  ),
  reminders AS (
    SELECT d.user_id, d.id, d.name, d.transaction_type, d.amount_idr, d.due_at,
           (o.value)::int AS offset_minutes,
           (d.due_at - make_interval(mins => (o.value)::int)) AS remind_at
    FROM due d
    CROSS JOIN LATERAL jsonb_array_elements(d.offsets) AS o(value)
    WHERE jsonb_typeof(d.offsets) = 'array' AND (o.value)::int >= 0
  ),
  inserted_recurring AS (
    INSERT INTO notification_jobs (user_id, type, channel, source_type, source_id, title, body, scheduled_at, dedupe_key)
    SELECT
      r.user_id,
      'recurring_reminder',
      'in_app',
      'recurring_template',
      r.id::text,
      'Pengingat: ' || r.name,
      format('%s • %s • jatuh tempo %s',
             CASE r.transaction_type
               WHEN 'income' THEN 'Pemasukan'
               WHEN 'transfer' THEN 'Transfer'
               ELSE 'Pengeluaran'
             END,
             'Rp ' || replace(to_char(r.amount_idr, 'FM999G999G999'), ',', '.'),
             to_char(r.due_at, 'DD Mon YYYY')),
      r.remind_at,
      'recurring:' || r.id::text || ':' || r.due_at || ':' || r.offset_minutes
    FROM reminders r
    WHERE r.remind_at <= NOW() + INTERVAL '1 day'
      AND r.remind_at > NOW() - INTERVAL '1 day'
    ON CONFLICT (user_id, dedupe_key) DO NOTHING
    RETURNING 1
  ),
  periods AS (
    SELECT b.id, b.user_id, b.name, b.budget_model, b.category_id, b.target_amount_idr,
           b.period_start, b.period_end,
           LEAST(b.period_end, CURRENT_DATE) AS eff_end,
           b.notify_at_80, b.notify_at_100, b.notify_over
    FROM budgets b
    JOIN notification_preferences p ON p.user_id = b.user_id
    WHERE b.is_active
      AND p.in_app_enabled
      AND p.budget_threshold_enabled
      AND b.period_start <= CURRENT_DATE
      AND b.period_end >= CURRENT_DATE
  ),
  non_env AS (
    SELECT p.id, p.user_id, p.name, p.period_start, p.notify_at_80, p.notify_at_100, p.notify_over,
           COALESCE(p.target_amount_idr, 0) AS allocated,
           COALESCE((SELECT SUM(t.amount_idr) FROM transactions t
                     WHERE t.user_id = p.user_id AND t.status = 'confirmed'
                       AND t.transaction_type = 'expense'
                       AND (p.category_id IS NULL OR t.category_id = p.category_id)
                       AND t.occurred_at::date >= p.period_start
                       AND t.occurred_at::date <= p.eff_end), 0) AS spent
    FROM periods p
    WHERE p.budget_model <> 'envelope'
  ),
  env AS (
    SELECT p.id, p.user_id, p.name, p.period_start, p.notify_at_80, p.notify_at_100, p.notify_over,
           COALESCE((SELECT SUM(a.allocated_amount_idr + COALESCE(a.rollover_amount_idr, 0))
                     FROM budget_allocations a WHERE a.budget_id = p.id), 0) AS allocated,
           COALESCE((SELECT SUM(t.amount_idr)
                     FROM budget_allocations a
                     JOIN transactions t ON t.user_id = p.user_id
                       AND t.status = 'confirmed' AND t.transaction_type = 'expense'
                       AND t.category_id = a.category_id
                       AND t.occurred_at::date >= a.period_start
                       AND t.occurred_at::date <= a.period_end
                     WHERE a.budget_id = p.id), 0) AS spent
    FROM periods p
    WHERE p.budget_model = 'envelope'
  ),
  combined AS (SELECT * FROM non_env UNION ALL SELECT * FROM env),
  alerts AS (
    SELECT c.*,
           round(c.spent::numeric / NULLIF(c.allocated, 0) * 100)::int AS pct,
           CASE
             WHEN c.notify_over AND c.spent > c.allocated THEN 'over'
             WHEN c.notify_at_100 AND c.spent >= c.allocated THEN 'over'
             WHEN c.notify_at_80 AND c.allocated > 0
               AND round(c.spent::numeric / c.allocated * 100) >= 80 THEN 'near'
             ELSE NULL
           END AS threshold
    FROM combined c
  ),
  inserted_budget AS (
    INSERT INTO notification_jobs (user_id, type, channel, source_type, source_id, title, body, scheduled_at, dedupe_key)
    SELECT
      a.user_id,
      'budget_alert',
      'in_app',
      'budget',
      a.id::text,
      (CASE WHEN a.threshold = 'over' THEN 'Anggaran terlampaui: ' ELSE 'Anggaran mendekati batas: ' END) || a.name,
      format('Terpakai %s dari %s (%s%%)',
             'Rp ' || replace(to_char(a.spent, 'FM999G999G999'), ',', '.'),
             'Rp ' || replace(to_char(a.allocated, 'FM999G999G999'), ',', '.'),
             COALESCE(a.pct, 100)),
      NOW(),
      'budget:' || a.id::text || ':' || a.period_start || ':' || a.threshold
    FROM alerts a
    WHERE a.threshold IS NOT NULL
    ON CONFLICT (user_id, dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT
    (SELECT COUNT(*) FROM inserted_recurring) AS recurring_reminders,
    (SELECT COUNT(*) FROM inserted_budget) AS budget_alerts;
$$;

GRANT EXECUTE ON FUNCTION public.scheduler_generate_notification_jobs() TO authenticated, anon, project_admin;