export type AccountType = 'cash' | 'bank' | 'e_wallet' | 'credit_card'
export type CategoryKind = 'income' | 'expense' | 'both'
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'
export type TransactionStatus = 'draft' | 'confirmed' | 'deleted'
export type TransactionSource = 'manual' | 'chat' | 'receipt' | 'recurring' | 'adjustment'
export type BudgetModel = 'monthly_category' | 'flexible_period' | 'envelope'
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type NotificationChannel = 'in_app' | 'email'
export type NotificationJobStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

export interface Profile {
  id: string
  display_name: string
  locale: string
  base_currency: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  in_app_enabled: boolean
  email_enabled: boolean
  recurring_reminder_enabled: boolean
  budget_threshold_enabled: boolean
  default_reminder_offset_minutes: number
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  account_type: AccountType
  opening_balance_idr: number
  opening_balance_at: string
  is_active: boolean
  archived_at: string | null
  icon: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  category_kind: CategoryKind
  is_system: boolean
  is_active: boolean
  color: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  transaction_type: TransactionType
  status: TransactionStatus
  occurred_at: string
  amount_idr: number
  merchant: string | null
  category_id: string | null
  source: TransactionSource
  note: string | null
  source_reference_id: string | null
  idempotency_key: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export interface TransactionLeg {
  id: string
  user_id: string
  transaction_id: string
  account_id: string
  direction: 'in' | 'out'
  amount_idr: number
  created_at: string
}

export interface TransactionItem {
  id: string
  user_id: string
  transaction_id: string
  name: string
  quantity: number | null
  unit_amount_idr: number | null
  total_amount_idr: number | null
  discount_idr: number | null
  category_id: string | null
  confidence: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ReceiptBatch {
  id: string
  user_id: string
  status: string
  provider: string | null
  model: string | null
  extraction_result: unknown | null
  conflict_summary: unknown | null
  created_at: string
  updated_at: string
}

export interface ReceiptAttachment {
  id: string
  user_id: string
  receipt_batch_id: string
  transaction_id: string | null
  storage_key: string
  storage_url: string | null
  mime_type: string
  size_bytes: number
  checksum: string | null
  sort_order: number
  delete_after_processing: boolean
  created_at: string
  deleted_at: string | null
}

export interface Budget {
  id: string
  user_id: string
  budget_model: BudgetModel
  name: string
  category_id: string | null
  period_start: string
  period_end: string
  target_amount_idr: number | null
  rollover_enabled: boolean
  is_active: boolean
  notify_at_80: boolean
  notify_at_100: boolean
  notify_over: boolean
  created_at: string
  updated_at: string
}

export interface BudgetAllocation {
  id: string
  user_id: string
  budget_id: string
  category_id: string
  period_start: string
  period_end: string
  allocated_amount_idr: number
  rollover_amount_idr: number | null
  created_at: string
  updated_at: string
}

export interface RecurringTemplate {
  id: string
  user_id: string
  name: string
  transaction_type: TransactionType
  amount_idr: number
  account_id: string | null
  transfer_from_id: string | null
  transfer_to_id: string | null
  category_id: string | null
  frequency: Frequency
  interval_value: number
  start_date: string
  end_date: string | null
  next_occurrence_at: string | null
  reminder_offsets: number[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationJob {
  id: string
  user_id: string
  type: string
  channel: NotificationChannel
  source_type: string | null
  source_id: string | null
  title: string
  body: string
  scheduled_at: string
  dedupe_key: string
  status: NotificationJobStatus
  attempt_count: number
  last_error: string | null
  read_at: string | null
  sent_at: string | null
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  session_id: string | null
  role: 'user' | 'assistant' | 'system'
  operation: string | null
  content: string
  status: string | null
  created_at: string
}

export interface AiUsage {
  id: string
  user_id: string
  operation: string
  provider: string | null
  model: string | null
  status: string
  input_tokens: number | null
  output_tokens: number | null
  estimated_cost_idr: number | null
  created_at: string
}

export interface TransactionLegWithAccount extends TransactionLeg {
  account?: { id: string; name: string; account_type: AccountType } | null
}

export interface TransactionWithRelations extends Transaction {
  legs: TransactionLegWithAccount[]
  category?: Category | null
  accounts?: { id: string; name: string; account_type: AccountType }[]
  items?: TransactionItem[]
}

export interface AccountWithBalance extends Account {
  balance_idr: number
}

export type ConfirmTransactionInput = {
  transaction_type: TransactionType
  amount_idr: number
  occurred_at: string
  merchant?: string | null
  note?: string | null
  category_id?: string | null
  source?: TransactionSource
  account_id?: string | null
  transfer_from_id?: string | null
  transfer_to_id?: string | null
  idempotency_key?: string | null
}

export type UpdateTransactionInput = ConfirmTransactionInput & { transaction_id: string }