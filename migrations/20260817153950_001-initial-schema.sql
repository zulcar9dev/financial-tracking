-- 001: Schema awal Financial Tracking AI
-- Tabel mengikuti model data PRD Section 14. Semua operasi tulis transaksi
-- dilakukan lewat function SECURITY DEFINER (002) agar atomik dan tervalidasi.

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'id-ID',
  base_currency TEXT NOT NULL DEFAULT 'IDR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  budget_threshold_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  default_reminder_offset_minutes INTEGER NOT NULL DEFAULT 1440 CHECK (default_reminder_offset_minutes >= 0),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_preferences_user_unique UNIQUE (user_id)
);

-- ============================================================
-- Accounts & categories
-- ============================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'bank', 'e_wallet', 'credit_card')),
  opening_balance_idr INTEGER NOT NULL DEFAULT 0 CHECK (opening_balance_idr >= 0),
  opening_balance_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX accounts_user_idx ON accounts (user_id);
CREATE INDEX accounts_user_active_idx ON accounts (user_id) WHERE archived_at IS NULL;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  category_kind TEXT NOT NULL DEFAULT 'both' CHECK (category_kind IN ('income', 'expense', 'both')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);
CREATE INDEX categories_user_idx ON categories (user_id);
-- Kategori system (user_id NULL) dibaca semua pengguna; kategori milik pengguna hanya oleh pemilik.

-- ============================================================
-- Transactions, legs, items
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'adjustment')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'deleted')),
  occurred_at TIMESTAMPTZ NOT NULL,
  amount_idr INTEGER NOT NULL CHECK (amount_idr > 0),
  merchant TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'chat', 'receipt', 'recurring', 'adjustment')),
  note TEXT,
  source_reference_id TEXT,
  idempotency_key TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_user_idempotency_unique UNIQUE (user_id, idempotency_key)
  -- Kepemilikan kategori divalidasi di function confirm/update (RLS + SECURITY DEFINER).
);
CREATE INDEX transactions_user_occurred_idx ON transactions (user_id, occurred_at DESC);
CREATE INDEX transactions_user_status_idx ON transactions (user_id, status);
CREATE INDEX transactions_user_category_idx ON transactions (user_id, category_id);
CREATE INDEX transactions_user_type_idx ON transactions (user_id, transaction_type);

CREATE TABLE transaction_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount_idr INTEGER NOT NULL CHECK (amount_idr > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legs_user_transaction_unique UNIQUE (transaction_id, account_id, direction)
);
CREATE INDEX transaction_legs_user_idx ON transaction_legs (user_id);
CREATE INDEX transaction_legs_tx_idx ON transaction_legs (transaction_id);
CREATE INDEX transaction_legs_account_idx ON transaction_legs (account_id);
-- Validasi jumlah leg per tipe transaksi dilakukan di function confirm/update (002).

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(12, 2),
  unit_amount_idr INTEGER CHECK (unit_amount_idr IS NULL OR unit_amount_idr > 0),
  total_amount_idr INTEGER CHECK (total_amount_idr IS NULL OR total_amount_idr > 0),
  discount_idr INTEGER CHECK (discount_idr IS NULL OR discount_idr >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  confidence NUMERIC(4, 3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX transaction_items_user_idx ON transaction_items (user_id);
CREATE INDEX transaction_items_tx_idx ON transaction_items (transaction_id);

-- ============================================================
-- Receipt (persiapan fitur struk)
-- ============================================================
CREATE TABLE receipt_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'review', 'confirmed', 'failed', 'discarded')),
  provider TEXT,
  model TEXT,
  extraction_result JSONB,
  conflict_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX receipt_batches_user_idx ON receipt_batches (user_id);

CREATE TABLE receipt_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_batch_id UUID NOT NULL REFERENCES receipt_batches(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  storage_key TEXT NOT NULL,
  storage_url TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  checksum TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  delete_after_processing BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX receipt_attachments_user_idx ON receipt_attachments (user_id);
CREATE INDEX receipt_attachments_batch_idx ON receipt_attachments (receipt_batch_id);
CREATE INDEX receipt_attachments_tx_idx ON receipt_attachments (transaction_id);

-- ============================================================
-- Budgets
-- ============================================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_model TEXT NOT NULL CHECK (budget_model IN ('monthly_category', 'flexible_period', 'envelope')),
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount_idr INTEGER CHECK (target_amount_idr IS NULL OR target_amount_idr > 0),
  rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notify_at_80 BOOLEAN NOT NULL DEFAULT TRUE,
  notify_at_100 BOOLEAN NOT NULL DEFAULT TRUE,
  notify_over BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budgets_period_order CHECK (period_end >= period_start)
  -- Kepemilikan kategori divalidasi di RLS/function.
);
CREATE INDEX budgets_user_idx ON budgets (user_id);
CREATE INDEX budgets_user_active_idx ON budgets (user_id, is_active);

CREATE TABLE budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocated_amount_idr INTEGER NOT NULL CHECK (allocated_amount_idr >= 0),
  rollover_amount_idr INTEGER CHECK (rollover_amount_idr IS NULL OR rollover_amount_idr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budget_allocations_period_order CHECK (period_end >= period_start)
);
CREATE INDEX budget_allocations_user_idx ON budget_allocations (user_id);
CREATE INDEX budget_allocations_budget_idx ON budget_allocations (budget_id);

-- ============================================================
-- Recurring & notifications
-- ============================================================
CREATE TABLE recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  amount_idr INTEGER NOT NULL CHECK (amount_idr > 0),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  transfer_from_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  transfer_to_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_value INTEGER NOT NULL DEFAULT 1 CHECK (interval_value >= 1),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence_at TIMESTAMPTZ,
  reminder_offsets JSONB NOT NULL DEFAULT '[1440]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recurring_period_order CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT recurring_transfer_accounts CHECK (
    transaction_type <> 'transfer'
    OR (transfer_from_id IS NOT NULL AND transfer_to_id IS NOT NULL AND transfer_from_id <> transfer_to_id)
  ),
  CONSTRAINT recurring_account_required CHECK (
    transaction_type = 'transfer' OR account_id IS NOT NULL
  )
);
CREATE INDEX recurring_templates_user_idx ON recurring_templates (user_id);

CREATE TABLE notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email')),
  source_type TEXT,
  source_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  dedupe_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_jobs_dedupe_unique UNIQUE (user_id, dedupe_key)
);
CREATE INDEX notification_jobs_user_idx ON notification_jobs (user_id, status, scheduled_at);

-- ============================================================
-- Chat & AI usage (persiapan fitur AI)
-- ============================================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX chat_sessions_user_idx ON chat_sessions (user_id);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  operation TEXT,
  content TEXT NOT NULL,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX chat_messages_user_idx ON chat_messages (user_id);
CREATE INDEX chat_messages_session_idx ON chat_messages (session_id);

CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'started',
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_idr INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ai_usage_user_created_idx ON ai_usage (user_id, created_at DESC);

-- ============================================================
-- Trigger updated_at
-- ============================================================
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER transaction_items_updated_at BEFORE UPDATE ON transaction_items FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER receipt_batches_updated_at BEFORE UPDATE ON receipt_batches FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER budget_allocations_updated_at BEFORE UPDATE ON budget_allocations FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER recurring_templates_updated_at BEFORE UPDATE ON recurring_templates FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
