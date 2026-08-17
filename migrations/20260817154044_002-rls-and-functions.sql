-- 002: RLS, GRANT, provisioning pengguna baru, dan functions atomik.
-- Prinsip: data finansial hanya dapat dibaca pemiliknya. Mutasi transaksi
-- hanya lewat SECURITY DEFINER functions (atomik + tervalidasi).

-- ============================================================
-- RLS: nyalakan di semua tabel data pengguna
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies
-- ============================================================
-- profiles: baca/ubah milik sendiri (baris dibuat trigger).
CREATE POLICY profiles_read_own ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- notification_preferences
CREATE POLICY prefs_read_own ON notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY prefs_update_own ON notification_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- accounts
CREATE POLICY accounts_read_own ON accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY accounts_insert_own ON accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY accounts_update_own ON accounts FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY accounts_delete_own ON accounts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- categories: milik sendiri + system (user_id NULL) untuk SELECT.
CREATE POLICY categories_read_own ON categories FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY categories_insert_own ON categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY categories_update_own ON categories FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY categories_delete_own ON categories FOR DELETE TO authenticated USING (user_id = auth.uid());

-- transactions & transaction_legs: SELECT only (mutasi lewat function).
CREATE POLICY transactions_read_own ON transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY transaction_legs_read_own ON transaction_legs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- transaction_items: CRUD (fitur item struk).
CREATE POLICY items_read_own ON transaction_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY items_insert_own ON transaction_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY items_update_own ON transaction_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY items_delete_own ON transaction_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- receipt
CREATE POLICY receipt_batches_read_own ON receipt_batches FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY receipt_batches_insert_own ON receipt_batches FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY receipt_batches_update_own ON receipt_batches FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY receipt_attachments_read_own ON receipt_attachments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY receipt_attachments_insert_own ON receipt_attachments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY receipt_attachments_update_own ON receipt_attachments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY receipt_attachments_delete_own ON receipt_attachments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- budgets
CREATE POLICY budgets_read_own ON budgets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY budgets_insert_own ON budgets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY budgets_update_own ON budgets FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY budgets_delete_own ON budgets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- budget_allocations
CREATE POLICY allocations_read_own ON budget_allocations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY allocations_insert_own ON budget_allocations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY allocations_update_own ON budget_allocations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY allocations_delete_own ON budget_allocations FOR DELETE TO authenticated USING (user_id = auth.uid());

-- recurring_templates
CREATE POLICY templates_read_own ON recurring_templates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY templates_insert_own ON recurring_templates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY templates_update_own ON recurring_templates FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY templates_delete_own ON recurring_templates FOR DELETE TO authenticated USING (user_id = auth.uid());

-- notification_jobs: SELECT + UPDATE (tandai dibaca). Insert hanya dari function scheduler.
CREATE POLICY jobs_read_own ON notification_jobs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY jobs_update_own ON notification_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- chat & ai_usage
CREATE POLICY chat_sessions_read_own ON chat_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY chat_sessions_insert_own ON chat_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY chat_sessions_update_own ON chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY chat_messages_read_own ON chat_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY chat_messages_insert_own ON chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_usage_read_own ON ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ai_usage_insert_own ON ai_usage FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- GRANT (RLS tetap memfilter; grants menentukan operasi yang bisa dicoba)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT, UPDATE ON notification_preferences TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;

-- Mutasi transaksi hanya lewat function confirm/update/delete.
REVOKE ALL ON transactions FROM anon, authenticated, public;
REVOKE ALL ON transaction_legs FROM anon, authenticated, public;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON transaction_legs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_templates TO authenticated;
GRANT SELECT, UPDATE ON notification_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_sessions TO authenticated;
GRANT SELECT, INSERT ON chat_messages TO authenticated;
GRANT SELECT, INSERT ON ai_usage TO authenticated;

-- ============================================================
-- View saldo berjalan per akun (FR-ACCOUNT-03)
-- ============================================================
CREATE OR REPLACE VIEW public.account_balances AS
SELECT
  a.id AS account_id,
  a.user_id,
  a.account_type,
  a.opening_balance_idr,
  COALESCE(
    SUM(
      CASE
        WHEN t.status = 'confirmed' AND l.direction = 'in' THEN l.amount_idr
        WHEN t.status = 'confirmed' AND l.direction = 'out' THEN -l.amount_idr
        ELSE 0
      END
    ),
    0
  ) AS legs_total_idr
FROM public.accounts a
LEFT JOIN public.transaction_legs l ON l.account_id = a.id
LEFT JOIN public.transactions t ON t.id = l.transaction_id
GROUP BY a.id;

GRANT SELECT ON public.account_balances TO authenticated;

-- ============================================================
-- Provisioning pengguna baru: profil + preferensi + kategori default
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  v_name := NULLIF(btrim(COALESCE(NEW.profile->>'name', NEW.metadata->>'name', '')), '');
  v_name := COALESCE(v_name, split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, v_name);
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);

  INSERT INTO public.categories (user_id, name, category_kind, color) VALUES
    (NEW.id, 'Makanan', 'expense', '#ff9c79'),
    (NEW.id, 'Transportasi', 'expense', '#8ebaff'),
    (NEW.id, 'Tagihan', 'expense', '#f4c86e'),
    (NEW.id, 'Belanja', 'expense', '#b8a9ff'),
    (NEW.id, 'Kesehatan', 'expense', '#ff897e'),
    (NEW.id, 'Hiburan', 'expense', '#f4a5d8'),
    (NEW.id, 'Pendidikan', 'expense', '#8ebaff'),
    (NEW.id, 'Gaji', 'income', '#c9f46c'),
    (NEW.id, 'Bonus', 'income', '#f4c86e'),
    (NEW.id, 'Transfer', 'both', '#91a097'),
    (NEW.id, 'Biaya Bank', 'expense', '#ff9c79'),
    (NEW.id, 'Lainnya', 'both', '#718177');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Function: confirm_transaction (idempotent, atomik)
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_transaction(
  p_transaction_type TEXT,
  p_amount_idr INTEGER,
  p_occurred_at TIMESTAMPTZ,
  p_merchant TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_account_id UUID DEFAULT NULL,
  p_transfer_from_id UUID DEFAULT NULL,
  p_transfer_to_id UUID DEFAULT NULL,
  p_leg_direction TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing public.transactions;
  v_tx public.transactions;
  v_dir TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_transaction_type NOT IN ('income', 'expense', 'transfer', 'adjustment') THEN
    RAISE EXCEPTION 'Tipe transaksi tidak dikenal';
  END IF;
  IF p_amount_idr IS NULL OR p_amount_idr <= 0 THEN
    RAISE EXCEPTION 'Jumlah harus lebih besar dari nol';
  END IF;
  IF p_occurred_at IS NULL THEN
    RAISE EXCEPTION 'Tanggal wajib diisi';
  END IF;

  -- Idempotensi: kembalikan record yang sudah ada (FR-TX-11).
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.transactions
      WHERE user_id = v_uid AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  IF p_category_id IS NOT NULL THEN
    PERFORM 1 FROM public.categories c
      WHERE c.id = p_category_id AND (c.user_id = v_uid OR c.user_id IS NULL);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Kategori tidak ditemukan';
    END IF;
  END IF;

  IF p_transaction_type = 'transfer' THEN
    IF p_transfer_from_id IS NULL OR p_transfer_to_id IS NULL THEN
      RAISE EXCEPTION 'Akun sumber dan tujuan wajib diisi';
    END IF;
    IF p_transfer_from_id = p_transfer_to_id THEN
      RAISE EXCEPTION 'Akun sumber dan tujuan tidak boleh sama';
    END IF;
    PERFORM 1 FROM public.accounts a WHERE a.id = p_transfer_from_id AND a.user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Akun sumber tidak ditemukan'; END IF;
    PERFORM 1 FROM public.accounts a WHERE a.id = p_transfer_to_id AND a.user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Akun tujuan tidak ditemukan'; END IF;
  ELSE
    IF p_account_id IS NULL THEN
      RAISE EXCEPTION 'Akun wajib diisi';
    END IF;
    PERFORM 1 FROM public.accounts a WHERE a.id = p_account_id AND a.user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Akun tidak ditemukan'; END IF;
    IF p_transaction_type = 'expense' AND p_category_id IS NULL THEN
      RAISE EXCEPTION 'Kategori wajib diisi untuk pengeluaran';
    END IF;
  END IF;

  INSERT INTO public.transactions (
    user_id, transaction_type, status, occurred_at, amount_idr, merchant,
    category_id, source, note, idempotency_key, confirmed_at
  ) VALUES (
    v_uid, p_transaction_type, 'confirmed', p_occurred_at, p_amount_idr,
    NULLIF(btrim(COALESCE(p_merchant, '')), ''),
    p_category_id, p_source, NULLIF(btrim(COALESCE(p_note, '')), ''),
    p_idempotency_key, NOW()
  )
  RETURNING * INTO v_tx;

  IF p_transaction_type = 'transfer' THEN
    INSERT INTO public.transaction_legs (user_id, transaction_id, account_id, direction, amount_idr)
    VALUES (v_uid, v_tx.id, p_transfer_from_id, 'out', p_amount_idr);
    INSERT INTO public.transaction_legs (user_id, transaction_id, account_id, direction, amount_idr)
    VALUES (v_uid, v_tx.id, p_transfer_to_id, 'in', p_amount_idr);
  ELSE
    IF p_transaction_type = 'income' THEN
      v_dir := 'in';
    ELSIF p_transaction_type = 'adjustment' AND p_leg_direction IN ('in', 'out') THEN
      v_dir := p_leg_direction;
    ELSE
      v_dir := 'out';
    END IF;
    INSERT INTO public.transaction_legs (user_id, transaction_id, account_id, direction, amount_idr)
    VALUES (v_uid, v_tx.id, p_account_id, v_dir, p_amount_idr);
  END IF;

  RETURN v_tx;
END;
$$;

-- ============================================================
-- Function: update_transaction (atomik; ganti legs seluruhnya)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_transaction(
  p_transaction_id UUID,
  p_transaction_type TEXT,
  p_amount_idr INTEGER,
  p_occurred_at TIMESTAMPTZ,
  p_merchant TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_account_id UUID DEFAULT NULL,
  p_transfer_from_id UUID DEFAULT NULL,
  p_transfer_to_id UUID DEFAULT NULL,
  p_leg_direction TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tx public.transactions;
  v_dir TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_tx FROM public.transactions
    WHERE id = p_transaction_id AND user_id = v_uid AND status <> 'deleted';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan';
  END IF;

  -- Validasi ulang (sama dengan confirm).
  IF p_transaction_type NOT IN ('income', 'expense', 'transfer', 'adjustment') THEN
    RAISE EXCEPTION 'Tipe transaksi tidak dikenal';
  END IF;
  IF p_amount_idr IS NULL OR p_amount_idr <= 0 THEN
    RAISE EXCEPTION 'Jumlah harus lebih besar dari nol';
  END IF;
  IF p_occurred_at IS NULL THEN
    RAISE EXCEPTION 'Tanggal wajib diisi';
  END IF;
  IF p_category_id IS NOT NULL THEN
    PERFORM 1 FROM public.categories c
      WHERE c.id = p_category_id AND (c.user_id = v_uid OR c.user_id IS NULL);
    IF NOT FOUND THEN RAISE EXCEPTION 'Kategori tidak ditemukan'; END IF;
  END IF;

  IF p_transaction_type = 'transfer' THEN
    IF p_transfer_from_id IS NULL OR p_transfer_to_id IS NULL THEN
      RAISE EXCEPTION 'Akun sumber dan tujuan wajib diisi';
    END IF;
    IF p_transfer_from_id = p_transfer_to_id THEN
      RAISE EXCEPTION 'Akun sumber dan tujuan tidak boleh sama';
    END IF;
    PERFORM 1 FROM public.accounts a WHERE a.id = p_transfer_from_id AND a.user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Akun sumber tidak ditemukan'; END IF;
    PERFORM 1 FROM public.accounts a WHERE a.id = p_transfer_to_id AND a.user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Akun tujuan tidak ditemukan'; END IF;
  ELSE
    IF p_account_id IS NULL THEN RAISE EXCEPTION 'Akun wajib diisi'; END IF;
    PERFORM 1 FROM public.accounts a WHERE a.id = p_account_id AND a.user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Akun tidak ditemukan'; END IF;
    IF p_transaction_type = 'expense' AND p_category_id IS NULL THEN
      RAISE EXCEPTION 'Kategori wajib diisi untuk pengeluaran';
    END IF;
  END IF;

  -- Ganti legs secara atomik dalam satu transaksi DB.
  DELETE FROM public.transaction_legs WHERE transaction_id = v_tx.id;

  UPDATE public.transactions SET
    transaction_type = p_transaction_type,
    amount_idr = p_amount_idr,
    occurred_at = p_occurred_at,
    merchant = NULLIF(btrim(COALESCE(p_merchant, '')), ''),
    note = NULLIF(btrim(COALESCE(p_note, '')), ''),
    category_id = p_category_id,
    source = p_source
  WHERE id = v_tx.id
  RETURNING * INTO v_tx;

  IF p_transaction_type = 'transfer' THEN
    INSERT INTO public.transaction_legs (user_id, transaction_id, account_id, direction, amount_idr)
    VALUES (v_uid, v_tx.id, p_transfer_from_id, 'out', p_amount_idr);
    INSERT INTO public.transaction_legs (user_id, transaction_id, account_id, direction, amount_idr)
    VALUES (v_uid, v_tx.id, p_transfer_to_id, 'in', p_amount_idr);
  ELSE
    IF p_transaction_type = 'income' THEN
      v_dir := 'in';
    ELSIF p_transaction_type = 'adjustment' AND p_leg_direction IN ('in', 'out') THEN
      v_dir := p_leg_direction;
    ELSE
      v_dir := 'out';
    END IF;
    INSERT INTO public.transaction_legs (user_id, transaction_id, account_id, direction, amount_idr)
    VALUES (v_uid, v_tx.id, p_account_id, v_dir, p_amount_idr);
  END IF;

  RETURN v_tx;
END;
$$;

-- ============================================================
-- Function: delete_transaction (soft-delete, audit tetap tersimpan)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transactions
    SET status = 'deleted', updated_at = NOW()
    WHERE id = p_transaction_id AND user_id = v_uid AND status <> 'deleted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan';
  END IF;
END;
$$;

-- ============================================================
-- Function: delete_user_data (FR-DATA-05/06/07)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.ai_usage WHERE user_id = v_uid;
  DELETE FROM public.chat_messages WHERE user_id = v_uid;
  DELETE FROM public.chat_sessions WHERE user_id = v_uid;
  DELETE FROM public.notification_jobs WHERE user_id = v_uid;
  DELETE FROM public.receipt_attachments WHERE user_id = v_uid;
  DELETE FROM public.receipt_batches WHERE user_id = v_uid;
  DELETE FROM public.budget_allocations WHERE user_id = v_uid;
  DELETE FROM public.budgets WHERE user_id = v_uid;
  DELETE FROM public.recurring_templates WHERE user_id = v_uid;
  DELETE FROM public.transaction_items WHERE user_id = v_uid;
  DELETE FROM public.transaction_legs WHERE user_id = v_uid;
  DELETE FROM public.transactions WHERE user_id = v_uid;
  DELETE FROM public.categories WHERE user_id = v_uid;
  DELETE FROM public.accounts WHERE user_id = v_uid;
  DELETE FROM public.notification_preferences WHERE user_id = v_uid;
  DELETE FROM public.profiles WHERE id = v_uid;
END;
$$;

-- ============================================================
-- Function: count_ai_usage_today (kuota AI, untuk tahap berikutnya)
-- ============================================================
CREATE OR REPLACE FUNCTION public.count_ai_usage_today()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.ai_usage
  WHERE user_id = auth.uid() AND created_at >= date_trunc('day', NOW())
$$;
