'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthActions } from '@insforge/sdk/ssr'
import { cookies } from 'next/headers'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export type ActionResult = { error: string | null }

export async function exportJsonAction(): Promise<{ error: string | null; fileName: string | null; content: string | null }> {
  const db = await createInsForgeServerClient()
  const { data: user } = await db.auth.getCurrentUser()
  if (!user?.user?.id) return { error: 'Sesi tidak valid.', fileName: null, content: null }
  const uid = user.user.id

  async function all(table: string, select = '*') {
    const { data } = await db.database.from(table).select(select).eq('user_id', uid).limit(1000)
    return data ?? []
  }

  const [profiles, preferences, accounts, categories, transactions, legs, items, budgets, allocations, templates, jobs, batches, attachments, sessions, messages, usage] =
    await Promise.all([
      db.database.from('profiles').select('*').eq('id', uid).maybeSingle().then((r) => r.data ?? null),
      db.database.from('notification_preferences').select('*').eq('user_id', uid).maybeSingle().then((r) => r.data ?? null),
      all('accounts'),
      all('categories'),
      all('transactions'),
      all('transaction_legs'),
      all('transaction_items'),
      all('budgets'),
      all('budget_allocations'),
      all('recurring_templates'),
      all('notification_jobs'),
      all('receipt_batches'),
      all('receipt_attachments'),
      all('chat_sessions'),
      all('chat_messages'),
      all('ai_usage'),
    ])

  const exportedAt = new Date().toISOString()
  const payload = {
    exported_at: exportedAt,
    app: 'financial-tracking',
    version: 1,
    profiles,
    notification_preferences: preferences,
    accounts,
    categories,
    transactions,
    transaction_legs: legs,
    transaction_items: items,
    budgets,
    budget_allocations: allocations,
    recurring_templates: templates,
    notification_jobs: jobs,
    receipt_batches: batches,
    receipt_attachments: attachments,
    chat_sessions: sessions,
    chat_messages: messages,
    ai_usage: usage,
  }

  return {
    error: null,
    fileName: `financial-tracking-export-${exportedAt.slice(0, 10)}.json`,
    content: JSON.stringify(payload, null, 2),
  }
}

export async function exportCsvAction(): Promise<{ error: string | null; fileName: string | null; content: string | null }> {
  const db = await createInsForgeServerClient()
  const { data: user } = await db.auth.getCurrentUser()
  if (!user?.user?.id) return { error: 'Sesi tidak valid.', fileName: null, content: null }
  const uid = user.user.id

  const select = `id, transaction_type, status, occurred_at, amount_idr, merchant, category_id, source, note,
    category:categories(name),
    legs:transaction_legs(account:accounts(name), direction, amount_idr)`

  const { data } = await db.database
    .from('transactions')
    .select(select)
    .eq('user_id', uid)
    .order('occurred_at', { ascending: false })
    .limit(2000)

  const rows = (data as unknown as {
    id: string
    transaction_type: string
    status: string
    occurred_at: string
    amount_idr: number
    merchant: string | null
    category: { name: string } | null
    source: string
    note: string | null
    legs: { account: { name: string } | null; direction: string; amount_idr: number }[] | null
  }[]) ?? []

  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const header = ['id', 'tanggal', 'tipe', 'nominal_idr', 'merchant', 'kategori', 'akun', 'sumber', 'catatan', 'status']
  const lines = rows.map((r) =>
    [
      r.id,
      r.occurred_at,
      r.transaction_type,
      r.amount_idr,
      r.merchant,
      r.category?.name ?? '',
      (r.legs ?? []).map((l) => `${l.account?.name ?? ''}:${l.direction}:${l.amount_idr}`).join('; '),
      r.source,
      r.note,
      r.transaction_type === 'transfer' ? 'transfer' : r.category ? 'confirmed' : r.status,
    ]
      .map(escape)
      .join(','),
  )

  return {
    error: null,
    fileName: `financial-tracking-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    content: [header.join(','), ...lines].join('\n'),
  }
}

export async function deleteAccountAction(input: {
  password: string
  confirmation: string
}): Promise<ActionResult> {
  if (input.confirmation.trim() !== 'HAPUS DATA SAYA') {
    return { error: 'Ketik HAPUS DATA SAYA untuk konfirmasi.' }
  }
  if (!input.password) return { error: 'Password wajib diisi untuk verifikasi ulang.' }

  const db = await createInsForgeServerClient()
  const { data: user } = await db.auth.getCurrentUser()
  if (!user?.user?.email) return { error: 'Sesi tidak valid.' }

  // Reauthentication: pastikan password benar sebelum penghapusan (FR-DATA-06).
  const { error: reauthError } = await db.auth.signInWithPassword({
    email: user.user.email,
    password: input.password,
  })
  if (reauthError) return { error: 'Password salah. Penghapusan dibatalkan.' }

  const { error } = await db.database.rpc('delete_user_data')
  if (error) return { error: error.message }

  const auth = createAuthActions({ cookies: await cookies() })
  await auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login?deleted=1')
}