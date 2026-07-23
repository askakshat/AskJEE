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

// Lazy singleton for browser/client-side Supabase client
let _client: SupabaseClient | null = null
export function getClient(): SupabaseClient {
  if (!_client) _client = createClient(getUrl(), getAnonKey())
  return _client
}

// For backward compat — used in signup/login routes
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as any)[prop]
  },
})

// Server-side client with a specific user's access token (respects RLS)
export function createServerClient(accessToken: string) {
  return createClient(getUrl(), getAnonKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

// Admin client — bypasses RLS entirely (uses service role key)
let _admin: SupabaseClient | null = null
export function getAdminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  if (!_admin) _admin = createClient(getUrl(), key)
  return _admin
}

// Extract access token from request
export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

// Get authenticated user ID from a request
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

// Get a DB client for the authenticated user.
// Prefers service role key (bypasses RLS). Falls back to user JWT (RLS applies).
export async function getUserClient(request: Request): Promise<SupabaseClient> {
  const token = getTokenFromRequest(request)
  if (!token) throw new Error('Not authenticated')

  // Validate token first
  const validateClient = createServerClient(token)
  const { data: { user }, error } = await validateClient.auth.getUser(token)
  if (error || !user) throw new Error('Invalid or expired token')

  // If service role key is available, use it (bypasses RLS — no permission issues)
  const admin = getAdminClient()
  if (admin) return admin

  // Otherwise use user's JWT client (RLS policies must be correct)
  return validateClient
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
