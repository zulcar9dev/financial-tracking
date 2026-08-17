'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import type { CategoryKind } from '@/lib/types'

export type ActionResult = { error: string | null }

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const name = String(formData.get('name') ?? '').trim()
  const kind = String(formData.get('category_kind') ?? 'both') as CategoryKind
  const color = String(formData.get('color') ?? '').trim() || null

  if (!name) return { error: 'Nama kategori wajib diisi.' }
  if (!['income', 'expense', 'both'].includes(kind)) return { error: 'Jenis kategori tidak valid.' }

  const { error } = await db.database.from('categories').insert([{ name, category_kind: kind, color }])
  if (error) return { error: error.message }
  revalidatePath('/app/categories')
  revalidatePath('/app/capture')
  revalidatePath('/app/budgets')
  return { error: null }
}

export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const kind = String(formData.get('category_kind') ?? 'both') as CategoryKind
  const color = String(formData.get('color') ?? '').trim() || null

  if (!id || !name) return { error: 'Data kategori tidak lengkap.' }
  if (!['income', 'expense', 'both'].includes(kind)) return { error: 'Jenis kategori tidak valid.' }

  const { error } = await db.database
    .from('categories')
    .update({ name, category_kind: kind, color })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/categories')
  revalidatePath('/app/capture')
  return { error: null }
}

export async function archiveCategoryAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database.from('categories').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/categories')
  return { error: null }
}

export async function reactivateCategoryAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const id = String(formData.get('id') ?? '')
  const { error } = await db.database.from('categories').update({ is_active: true }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/categories')
  return { error: null }
}