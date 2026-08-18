import { createAdminClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const schedulerSecret = Deno.env.get('SCHEDULER_SECRET')
  if (schedulerSecret) {
    const headerToken = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    let bodySecret: string | null = null
    try {
      const body = await req.json()
      if (typeof body?.secret === 'string') bodySecret = body.secret
    } catch {
      // body tidak wajib — hanya untuk test invoke via CLI
    }
    if (headerToken !== schedulerSecret && bodySecret !== schedulerSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') ?? Deno.env.get('INSFORGE_URL')
  const apiKey = Deno.env.get('INSFORGE_API_KEY')
  if (!baseUrl || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing INSFORGE_BASE_URL or INSFORGE_API_KEY' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const client = createAdminClient({ baseUrl, apiKey })
  const { data, error } = await client.database.rpc('scheduler_generate_notification_jobs')
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, created: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
