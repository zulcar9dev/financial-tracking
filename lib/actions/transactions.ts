'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import type { TransactionSource, TransactionType } from '@/lib/types'

export type ActionResult = { error: string | null }

export type ConfirmTransactionPayload = {
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
  leg_direction?: 'in' | 'out' | null
  idempotency_key?: string | null
}

export async function confirmTransactionAction(payload: ConfirmTransactionPayload): Promise<
  { error: string | null; id: string | null }
> {
  const db = await createInsForgeServerClient()
  const { data, error } = await db.database.rpc('confirm_transaction', {
    p_transaction_type: payload.transaction_type,
    p_amount_idr: payload.amount_idr,
    p_occurred_at: payload.occurred_at,
    p_merchant: payload.merchant ?? null,
    p_note: payload.note ?? null,
    p_category_id: payload.category_id ?? null,
    p_source: payload.source ?? 'manual',
    p_account_id: payload.account_id ?? null,
    p_transfer_from_id: payload.transfer_from_id ?? null,
    p_transfer_to_id: payload.transfer_to_id ?? null,
    p_leg_direction: payload.leg_direction ?? null,
    p_idempotency_key: payload.idempotency_key ?? null,
  })
  if (error) return { error: error.message, id: null }
  revalidatePath('/app/transactions')
  revalidatePath('/app/dashboard')
  revalidatePath('/app/accounts')
  revalidatePath('/app/budgets')
  return { error: null, id: (data as { id?: string } | null)?.id ?? null }
}

export async function updateTransactionAction(payload: ConfirmTransactionPayload & { transaction_id: string }): Promise<
  { error: string | null; id: string | null }
> {
  const db = await createInsForgeServerClient()
  const { data, error } = await db.database.rpc('update_transaction', {
    p_transaction_id: payload.transaction_id,
    p_transaction_type: payload.transaction_type,
    p_amount_idr: payload.amount_idr,
    p_occurred_at: payload.occurred_at,
    p_merchant: payload.merchant ?? null,
    p_note: payload.note ?? null,
    p_category_id: payload.category_id ?? null,
    p_source: payload.source ?? 'manual',
    p_account_id: payload.account_id ?? null,
    p_transfer_from_id: payload.transfer_from_id ?? null,
    p_transfer_to_id: payload.transfer_to_id ?? null,
    p_leg_direction: payload.leg_direction ?? null,
  })
  if (error) return { error: error.message, id: null }
  revalidatePath('/app/transactions')
  revalidatePath('/app/dashboard')
  revalidatePath('/app/accounts')
  revalidatePath('/app/budgets')
  return { error: null, id: (data as { id?: string } | null)?.id ?? null }
}

export async function deleteTransactionAction(input: { id: string }): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const { error } = await db.database.rpc('delete_transaction', { p_transaction_id: input.id })
  if (error) return { error: error.message }
  revalidatePath('/app/transactions')
  revalidatePath('/app/dashboard')
  revalidatePath('/app/accounts')
  revalidatePath('/app/budgets')
  return { error: null }
}