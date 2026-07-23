import { getTokenFromRequest, createServerClient, jsonResponse, errorResponse } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

export async function GET(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) return errorResponse('Not authenticated', 401)

  try {
    const client = createServerClient(token)
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return errorResponse('Not authenticated', 401)

    const { data: profile } = await client
      .from('profiles')
      .select('name, target_year, reminders_enabled')
      .eq('id', user.id)
      .maybeSingle()

    return jsonResponse({
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || null,
      targetYear: profile?.target_year || null,
      remindersEnabled: profile?.reminders_enabled ?? true,
    })
  } catch {
    return errorResponse('Not authenticated', 401)
  }
}