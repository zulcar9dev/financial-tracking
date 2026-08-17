import { createAdminClient } from '@insforge/sdk'

export function createInsForgeAdminClient() {
  const baseUrl = process.env.INSFORGE_URL
  const apiKey = process.env.INSFORGE_API_KEY
  if (!baseUrl || !apiKey) {
    throw new Error('INSFORGE_URL dan INSFORGE_API_KEY wajib ada di environment server')
  }
  return createAdminClient({ baseUrl, apiKey })
}