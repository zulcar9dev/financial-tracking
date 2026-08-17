-- Set DEFAULT auth.uid() pada kolom user_id semua tabel milik-pengguna.
-- Memungkinkan insert dari server actions tanpa menyebut user_id secara eksplisit,
-- sementara RLS WITH CHECK (user_id = auth.uid()) tetap terpenuhi.
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT auth.uid();
ALTER TABLE public.notification_preferences ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.transactions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.transaction_legs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.transaction_items ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.receipt_batches ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.receipt_attachments ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.budgets ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.budget_allocations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.recurring_templates ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.notification_jobs ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.chat_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.chat_messages ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ai_usage ALTER COLUMN user_id SET DEFAULT auth.uid();