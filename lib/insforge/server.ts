import { cookies } from 'next/headers'
import { createServerClient } from '@insforge/sdk/ssr'

export async function createInsForgeServerClient() {
  return createServerClient({ cookies: await cookies() })
}

export async function getCurrentUser() {
  const insforge = await createInsForgeServerClient()
  const { data, error } = await insforge.auth.getCurrentUser()
  if (error || !data?.user) return null
  return data.user
}