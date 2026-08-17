'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import type { BudgetModel } from '@/lib/types'

export type ActionResult = { error: string | null }

export type BudgetPayload = {
  budget_model: BudgetModel
  name: string
  category_id: string | null
  period_start: string
  period_end: string
  target_amount_idr: number | null
  rollover_enabled: boolean
  notify_at_80: boolean
  notify_at_100: boolean
  notify_over: boolean
  allocations: { category_id: string; period_start: string; period_end: string; allocated_amount_idr: number }[]
}

export async function createBudgetAction(payload: BudgetPayload): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  if (!payload.name.trim()) return { error: 'Nama anggaran wajib diisi.' }
  if (!payload.period_start || !payload.period_end) return { error: 'Periode anggaran wajib diisi.' }
  if (payload.period_end < payload.period_start) return { error: 'Tanggal akhir tidak boleh sebelum tanggal mulai.' }
  if (payload.budget_model === 'envelope') {
    if (payload.allocations.length === 0) return { error: 'Envelope minimal memiliki satu alokasi kategori.' }
  } else if (!payload.category_id) {
    return { error: 'Kategori wajib dipilih.' }
  }

  const { data, error } = await db.database
    .from('budgets')
    .insert([
      {
        budget_model: payload.budget_model,
        name: payload.name.trim(),
        category_id: payload.budget_model === 'envelope' ? null : payload.category_id,
        period_start: payload.period_start,
        period_end: payload.period_end,
        target_amount_idr: payload.budget_model === 'envelope' ? null : payload.target_amount_idr,
        rollover_enabled: payload.rollover_enabled,
        notify_at_80: payload.notify_at_80,
        notify_at_100: payload.notify_at_100,
        notify_over: payload.notify_over,
        is_active: true,
      },
    ])
    .select()
  if (error) return { error: error.message }

  if (payload.budget_model === 'envelope' && data) {
    const budgetId = (data as { id: string }[])[0].id
    const { error: allocError } = await db.database.from('budget_allocations').insert(
      payload.allocations.map((a) => ({
        budget_id: budgetId,
        category_id: a.category_id,
        period_start: a.period_start,
        period_end: a.period_end,
        allocated_amount_idr: a.allocated_amount_idr,
      })),
    )
    if (allocError) return { error: allocError.message }
  }

  revalidatePath('/app/budgets')
  revalidatePath('/app/dashboard')
  return { error: null }
}

export async function updateBudgetAction(payload: BudgetPayload & { id: string }): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  if (!payload.name.trim()) return { error: 'Nama anggaran wajib diisi.' }
  if (payload.period_end < payload.period_start) return { error: 'Tanggal akhir tidak boleh sebelum tanggal mulai.' }

  const { error } = await db.database
    .from('budgets')
    .update({
      budget_model: payload.budget_model,
      name: payload.name.trim(),
      category_id: payload.budget_model === 'envelope' ? null : payload.category_id,
      period_start: payload.period_start,
      period_end: payload.period_end,
      target_amount_idr: payload.budget_model === 'envelope' ? null : payload.target_amount_idr,
      rollover_enabled: payload.rollover_enabled,
      notify_at_80: payload.notify_at_80,
      notify_at_100: payload.notify_at_100,
      notify_over: payload.notify_over,
    })
    .eq('id', payload.id)
  if (error) return { error: error.message }

  if (payload.budget_model === 'envelope') {
    await db.database.from('budget_allocations').delete().eq('budget_id', payload.id)
    const { error: allocError } = await db.database.from('budget_allocations').insert(
      payload.allocations.map((a) => ({
        budget_id: payload.id,
        category_id: a.category_id,
        period_start: a.period_start,
        period_end: a.period_end,
        allocated_amount_idr: a.allocated_amount_idr,
      })),
    )
    if (allocError) return { error: allocError.message }
  }

  revalidatePath('/app/budgets')
  revalidatePath('/app/dashboard')
  return { error: null }
}

export async function deleteBudgetAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database.from('budgets').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/budgets')
  return { error: null }
}

export async function toggleBudgetActiveAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const active = formData.get('active') === 'on'
  const { error } = await db.database.from('budgets').update({ is_active: active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/budgets')
  return { error: null }
}