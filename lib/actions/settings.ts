'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export type ActionResult = { error: string | null }

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const displayName = String(formData.get('display_name') ?? '').trim()
  const timezone = String(formData.get('timezone') ?? 'Asia/Jakarta')
  const locale = String(formData.get('locale') ?? 'id-ID')

  if (!displayName) return { error: 'Nama tampilan wajib diisi.' }

  const { error } = await db.database
    .from('profiles')
    .update({ display_name: displayName, timezone, locale })
    .eq('id', String(formData.get('user_id') ?? ''))
  if (error) return { error: error.message }
  revalidatePath('/app/settings/profile')
  revalidatePath('/app/dashboard')
  return { error: null }
}