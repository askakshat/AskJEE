import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  return url
}

function getAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
  return key
}

let _client: SupabaseClient | null = null
export function getClient(): SupabaseClient {
  if (!_client) _client = createClient(getUrl(), getAnonKey())
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as any)[prop]
  },
})

export function createServerClient(accessToken: string) {
  return createClient(getUrl(), getAnonKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export async function getUserId(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  try {
    const client = createServerClient(token)
    const { data: { user } } = await client.auth.getUser(token)
    return user?.id || null
  } catch {
    return null
  }
}

// Simple helper: get a Supabase client authenticated as the user
// Uses the user's own JWT token — RLS policies must allow the operation
export async function getDb(request: Request): Promise<SupabaseClient> {
  const token = getTokenFromRequest(request)
  if (!token) throw new Error('Not authenticated')
  const client = createServerClient(token)
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) throw new Error('Invalid or expired token')
  return client
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}