import { createInsForgeServerClient } from '@/lib/insforge/server'
import type {
  Account,
  AccountWithBalance,
  Budget,
  BudgetAllocation,
  Category,
  NotificationJob,
  NotificationPreferences,
  Profile,
  RecurringTemplate,
  Transaction,
  TransactionWithRelations,
} from '@/lib/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database.from('profiles').select('*').eq('id', userId).maybeSingle()
  return (data as Profile) ?? null
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as NotificationPreferences) ?? null
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('accounts')
    .select('id, name, account_type, opening_balance_idr, opening_balance_at, is_active, archived_at, icon, color, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return (data as Account[]) ?? []
}

export async function getAccountsWithBalances(userId: string): Promise<AccountWithBalance[]> {
  const db = await createInsForgeServerClient()
  const accounts = await getAccounts(userId)
  if (accounts.length === 0) return []

  const { data: balances } = await db.database
    .from('account_balances')
    .select('account_id, opening_balance_idr, legs_total_idr')
    .eq('user_id', userId)

  const balanceMap = new Map<string, number>()
  for (const b of balances ?? []) {
    balanceMap.set(b.account_id, (b.opening_balance_idr ?? 0) + (b.legs_total_idr ?? 0))
  }

  return accounts.map((a) => ({ ...a, balance_idr: balanceMap.get(a.id) ?? a.opening_balance_idr }))
}

export async function getCategories(userId: string): Promise<Category[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('categories')
    .select('id, name, category_kind, is_system, is_active, color, user_id')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  const system: Category[] = []
  if (data) {
    const ownIds = new Set((data as Category[]).map((c) => c.name))
    const { data: sys } = await db.database
      .from('categories')
      .select('id, name, category_kind, is_system, is_active, color, user_id')
      .is('user_id', null)
    for (const c of (sys as Category[]) ?? []) {
      if (!ownIds.has(c.name)) system.push(c)
    }
  }
  return [...(data as Category[]), ...system]
}

export type TransactionFilters = {
  period?: string
  type?: string
  accountId?: string
  categoryId?: string
  merchant?: string
  source?: string
  page?: number
  pageSize?: number
}

export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {},
): Promise<{ rows: TransactionWithRelations[]; total: number }> {
  const db = await createInsForgeServerClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, filters.pageSize ?? 20)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const select = `id, transaction_type, status, occurred_at, amount_idr, merchant, category_id, source, note, idempotency_key, confirmed_at, created_at, updated_at,
    category:categories(id, name, color),
    legs:transaction_legs(account_id, direction, amount_idr, account:accounts(name, account_type))`

  let query = db.database
    .from('transactions')
    .select(select, { count: 'exact' })
    .eq('user_id', userId)
    .neq('status', 'deleted')

  if (filters.type) query = query.eq('transaction_type', filters.type)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.merchant) query = query.ilike('merchant', `%${filters.merchant}%`)
  if (filters.source) query = query.eq('source', filters.source)
  if (filters.accountId) {
    const { data: legTxs } = await db.database
      .from('transaction_legs')
      .select('transaction_id')
      .eq('user_id', userId)
      .eq('account_id', filters.accountId)
    const txIds = (legTxs ?? []).map((l) => l.transaction_id)
    if (txIds.length === 0) return { rows: [], total: 0 }
    query = query.in('id', txIds)
  }
  if (filters.period === 'this_month' || filters.period === 'last_month' || filters.period === 'last_30_days' || filters.period === 'this_year') {
    void 0
  }

  const { data, error, count } = await query
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return { rows: (data as unknown as TransactionWithRelations[]) ?? [], total: count ?? 0 }
}

export async function getTransaction(userId: string, id: string): Promise<TransactionWithRelations | null> {
  const db = await createInsForgeServerClient()
  const select = `*,
    category:categories(id, name, color),
    legs:transaction_legs(account_id, direction, amount_idr, account:accounts(id, name, account_type)),
    items:transaction_items(id, name, quantity, unit_amount_idr, total_amount_idr, discount_idr, confidence, sort_order)`
  const { data } = await db.database
    .from('transactions')
    .select(select)
    .eq('user_id', userId)
    .eq('id', id)
    .neq('status', 'deleted')
    .maybeSingle()
  return (data as unknown as TransactionWithRelations | null) ?? null
}

export type PeriodBounds = { from: string; to: string }

export async function getPeriodTotals(
  userId: string,
  from: Date,
  to: Date,
): Promise<{ income: number; expense: number; transfer: number }> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('transactions')
    .select('transaction_type, amount_idr')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('occurred_at', from.toISOString())
    .lte('occurred_at', to.toISOString())

  let income = 0
  let expense = 0
  let transfer = 0
  for (const t of (data ?? []) as Transaction[]) {
    if (t.transaction_type === 'income') income += t.amount_idr
    else if (t.transaction_type === 'expense') expense += t.amount_idr
    else if (t.transaction_type === 'transfer') transfer += t.amount_idr
  }
  return { income, expense, transfer }
}

export async function getCategorySpending(
  userId: string,
  from: Date,
  to: Date,
): Promise<{ category_id: string; name: string; color: string | null; total: number }[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('transactions')
    .select('category_id, amount_idr, category:categories(name, color)')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .eq('transaction_type', 'expense')
    .gte('occurred_at', from.toISOString())
    .lte('occurred_at', to.toISOString())

  const map = new Map<string, { name: string; color: string | null; total: number }>()
  for (const t of (data ?? []) as unknown as { category_id: string | null; amount_idr: number; category: Category | null }[]) {
    const key = t.category_id ?? 'uncategorized'
    const entry = map.get(key) ?? {
      name: t.category?.name ?? 'Tanpa kategori',
      color: t.category?.color ?? null,
      total: 0,
    }
    entry.total += t.amount_idr
    map.set(key, entry)
  }
  return Array.from(map.entries()).map(([category_id, v]) => ({ category_id, ...v })).sort((a, b) => b.total - a.total)
}

export async function getRecentTransactions(userId: string, limit = 6): Promise<TransactionWithRelations[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('transactions')
    .select(`id, transaction_type, status, occurred_at, amount_idr, merchant, category_id, source,
      category:categories(name, color),
      legs:transaction_legs(account_id, direction, amount_idr, account:accounts(name, account_type))`)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  return (data as unknown as TransactionWithRelations[]) ?? []
}

export async function getBudgets(userId: string): Promise<Budget[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return (data as Budget[]) ?? []
}

export async function getAllBudgets(userId: string): Promise<Budget[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data as Budget[]) ?? []
}

export async function getBudgetAllocations(userId: string): Promise<BudgetAllocation[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('budget_allocations')
    .select('*')
    .eq('user_id', userId)
  return (data as BudgetAllocation[]) ?? []
}

export async function getRecurringTemplates(userId: string): Promise<RecurringTemplate[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('recurring_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data as RecurringTemplate[]) ?? []
}

export async function getNotificationJobs(userId: string, limit = 50): Promise<NotificationJob[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('notification_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: false })
    .limit(limit)
  return (data as NotificationJob[]) ?? []
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const db = await createInsForgeServerClient()
  const { count } = await db.database
    .from('notification_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
  return count ?? 0
}

export async function getConfirmedExpenseTransactions(userId: string): Promise<Transaction[]> {
  const db = await createInsForgeServerClient()
  const { data } = await db.database
    .from('transactions')
    .select('id, user_id, transaction_type, status, occurred_at, amount_idr, merchant, category_id, source, note')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .eq('transaction_type', 'expense')
    .order('occurred_at', { ascending: false })
    .limit(2000)
  return (data as Transaction[]) ?? []
}

export async function getUpcomingRecurring(userId: string, limit = 5): Promise<RecurringTemplate[]> {
  const db = await createInsForgeServerClient()
  const now = new Date().toISOString()
  const { data } = await db.database
    .from('recurring_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('next_occurrence_at', now)
    .order('next_occurrence_at', { ascending: true })
    .limit(limit)
  return (data as RecurringTemplate[]) ?? []
}