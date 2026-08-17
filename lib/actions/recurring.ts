'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import type { Frequency, TransactionType } from '@/lib/types'

export type ActionResult = { error: string | null }

export type TemplatePayload = {
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
  reminder_offsets: number[]
}

function computeNextOccurrence(startDate: string, frequency: Frequency, interval: number, from = new Date()): string {
  const current = new Date(`${startDate}T00:00:00.000Z`)
  if (current.getTime() > from.getTime()) return current.toISOString()

  let candidate = new Date(current)
  let guard = 0
  while (candidate.getTime() <= from.getTime() && guard < 2000) {
    const next = new Date(candidate)
    if (frequency === 'daily') next.setUTCDate(next.getUTCDate() + interval)
    else if (frequency === 'weekly') next.setUTCDate(next.getUTCDate() + interval * 7)
    else if (frequency === 'monthly') next.setUTCMonth(next.getUTCMonth() + interval)
    else next.setUTCFullYear(next.getUTCFullYear() + interval)
    candidate = next
    guard++
  }
  return candidate.toISOString()
}

export async function createTemplateAction(payload: TemplatePayload): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  if (!payload.name.trim()) return { error: 'Nama template wajib diisi.' }
  if (payload.amount_idr <= 0) return { error: 'Nominal harus lebih besar dari nol.' }
  if (!payload.start_date) return { error: 'Tanggal mulai wajib diisi.' }
  if (payload.end_date && payload.end_date < payload.start_date) {
    return { error: 'Tanggal akhir tidak boleh sebelum tanggal mulai.' }
  }
  if (payload.transaction_type === 'transfer') {
    if (!payload.transfer_from_id || !payload.transfer_to_id) return { error: 'Akun sumber dan tujuan wajib diisi.' }
    if (payload.transfer_from_id === payload.transfer_to_id) return { error: 'Akun sumber dan tujuan tidak boleh sama.' }
  } else if (!payload.account_id) {
    return { error: 'Akun wajib diisi.' }
  }

  const next = computeNextOccurrence(payload.start_date, payload.frequency, payload.interval_value)

  const { error } = await db.database.from('recurring_templates').insert([
    {
      name: payload.name.trim(),
      transaction_type: payload.transaction_type,
      amount_idr: payload.amount_idr,
      account_id: payload.transaction_type === 'transfer' ? null : payload.account_id,
      transfer_from_id: payload.transaction_type === 'transfer' ? payload.transfer_from_id : null,
      transfer_to_id: payload.transaction_type === 'transfer' ? payload.transfer_to_id : null,
      category_id: payload.transaction_type === 'expense' ? payload.category_id : null,
      frequency: payload.frequency,
      interval_value: payload.interval_value,
      start_date: payload.start_date,
      end_date: payload.end_date,
      next_occurrence_at: next,
      reminder_offsets: JSON.stringify(payload.reminder_offsets.length ? payload.reminder_offsets : [1440]),
      is_active: true,
    },
  ])
  if (error) return { error: error.message }
  revalidatePath('/app/recurring')
  revalidatePath('/app/dashboard')
  return { error: null }
}

export async function updateTemplateAction(payload: TemplatePayload & { id: string }): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const { error } = await db.database
    .from('recurring_templates')
    .update({
      name: payload.name.trim(),
      transaction_type: payload.transaction_type,
      amount_idr: payload.amount_idr,
      account_id: payload.transaction_type === 'transfer' ? null : payload.account_id,
      transfer_from_id: payload.transaction_type === 'transfer' ? payload.transfer_from_id : null,
      transfer_to_id: payload.transaction_type === 'transfer' ? payload.transfer_to_id : null,
      category_id: payload.transaction_type === 'expense' ? payload.category_id : null,
      frequency: payload.frequency,
      interval_value: payload.interval_value,
      start_date: payload.start_date,
      end_date: payload.end_date,
      reminder_offsets: JSON.stringify(payload.reminder_offsets.length ? payload.reminder_offsets : [1440]),
    })
    .eq('id', payload.id)
  if (error) return { error: error.message }
  revalidatePath('/app/recurring')
  return { error: null }
}

export async function deleteTemplateAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database.from('recurring_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/recurring')
  return { error: null }
}

export async function toggleTemplateAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const active = formData.get('active') === 'on'
  const { error } = await db.database.from('recurring_templates').update({ is_active: active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/recurring')
  return { error: null }
}

export async function recordOccurrenceAction(input: { template_id: string; occurred_at: string }): Promise<
  { error: string | null; transaction_id: string | null }
> {
  const db = await createInsForgeServerClient()
  const { data: template } = await db.database
    .from('recurring_templates')
    .select('*')
    .eq('id', input.template_id)
    .maybeSingle()

  if (!template) return { error: 'Template tidak ditemukan.', transaction_id: null }

  const t = template as {
    id: string
    name: string
    transaction_type: TransactionType
    amount_idr: number
    account_id: string | null
    transfer_from_id: string | null
    transfer_to_id: string | null
    category_id: string | null
  }

  const { data, error } = await db.database.rpc('confirm_transaction', {
    p_transaction_type: t.transaction_type,
    p_amount_idr: t.amount_idr,
    p_occurred_at: input.occurred_at,
    p_merchant: t.name,
    p_note: 'Dibuat dari template berulang',
    p_category_id: t.category_id,
    p_source: 'recurring',
    p_account_id: t.account_id,
    p_transfer_from_id: t.transfer_from_id,
    p_transfer_to_id: t.transfer_to_id,
    p_leg_direction: null,
    p_idempotency_key: null,
  })
  if (error) return { error: error.message, transaction_id: null }

  revalidatePath('/app/transactions')
  revalidatePath('/app/dashboard')
  return { error: null, transaction_id: (data as { id?: string } | null)?.id ?? null }
}