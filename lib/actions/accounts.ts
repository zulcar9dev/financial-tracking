'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import type { AccountType } from '@/lib/types'

export type ActionResult = { error: string | null }

export async function createAccountAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const name = String(formData.get('name') ?? '').trim()
  const accountType = String(formData.get('account_type') ?? '') as AccountType
  const opening = parseInt(String(formData.get('opening_balance_idr') ?? '0').replace(/\D/g, '') || '0', 10)
  const openingDate = String(formData.get('opening_balance_at') ?? '')
  const color = String(formData.get('color') ?? '').trim() || null
  const icon = String(formData.get('icon') ?? '').trim() || null

  if (!name) return { error: 'Nama akun wajib diisi.' }
  if (!['cash', 'bank', 'e_wallet', 'credit_card'].includes(accountType)) {
    return { error: 'Tipe akun tidak valid.' }
  }
  if (opening < 0) return { error: 'Saldo awal tidak boleh negatif.' }

  const { error } = await db.database.from('accounts').insert([
    {
      name,
      account_type: accountType,
      opening_balance_idr: opening,
      opening_balance_at: openingDate ? new Date(`${openingDate}T00:00:00.000Z`).toISOString() : new Date().toISOString(),
      color,
      icon,
    },
  ])
  if (error) return { error: error.message }
  revalidatePath('/app/accounts')
  revalidatePath('/app/dashboard')
  revalidatePath('/app/capture')
  return { error: null }
}

export async function updateAccountAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const accountType = String(formData.get('account_type') ?? '') as AccountType
  const isActive = formData.get('is_active') === 'on'
  const color = String(formData.get('color') ?? '').trim() || null

  if (!id || !name) return { error: 'Data akun tidak lengkap.' }
  if (!['cash', 'bank', 'e_wallet', 'credit_card'].includes(accountType)) {
    return { error: 'Tipe akun tidak valid.' }
  }

  const { error } = await db.database
    .from('accounts')
    .update({ name, account_type: accountType, is_active: isActive, color })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/accounts')
  revalidatePath('/app/dashboard')
  return { error: null }
}

export async function archiveAccountAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database
    .from('accounts')
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/accounts')
  revalidatePath('/app/dashboard')
  return { error: null }
}

export async function reactivateAccountAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database
    .from('accounts')
    .update({ is_active: true, archived_at: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/accounts')
  return { error: null }
}

export async function deleteAccountAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database.from('accounts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/accounts')
  return { error: null }
}

export async function goToAccounts() {
  redirect('/app/accounts')
}