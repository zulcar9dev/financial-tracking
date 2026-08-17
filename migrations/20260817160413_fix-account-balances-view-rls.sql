-- Perbaikan keamanan: view account_balances bocor ke semua pengguna karena
-- views tidak menerapkan RLS tabel dasar secara otomatis. Tambahkan filter
-- user_id = auth.uid() langsung di dalam view.
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
WHERE a.user_id = auth.uid()
GROUP BY a.id;

GRANT SELECT ON public.account_balances TO authenticated;