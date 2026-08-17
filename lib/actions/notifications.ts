'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export type ActionResult = { error: string | null }

export async function markNotificationReadAction(input: { id: string }): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const { error } = await db.database
    .from('notification_jobs')
    .update({ read_at: new Date().toISOString() })
    .eq('id', input.id)
  if (error) return { error: error.message }
  revalidatePath('/app/notifications')
  return { error: null }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const { error } = await db.database
    .from('notification_jobs')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) return { error: error.message }
  revalidatePath('/app/notifications')
  return { error: null }
}

export async function updateNotificationPreferencesAction(formData: FormData): Promise<ActionResult> {
  const db = await createInsForgeServerClient()
  const offset = Math.max(0, parseInt(String(formData.get('default_reminder_offset_minutes') ?? '1440'), 10) || 1440)
  const { error } = await db.database.from('notification_preferences').update({
    in_app_enabled: formData.get('in_app_enabled') === 'on',
    email_enabled: formData.get('email_enabled') === 'on',
    recurring_reminder_enabled: formData.get('recurring_reminder_enabled') === 'on',
    budget_threshold_enabled: formData.get('budget_threshold_enabled') === 'on',
    default_reminder_offset_minutes: offset,
  })
  if (error) return { error: error.message }
  revalidatePath('/app/notifications')
  return { error: null }
}