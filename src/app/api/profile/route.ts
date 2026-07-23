import { getUserId, getUserClient, createServerClient, getTokenFromRequest, jsonResponse, errorResponse } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const db = await getUserClient(request)

    const { data } = await db
      .from('profiles')
      .select('id, email, name, target_year, reminders_enabled')
      .eq('id', userId)
      .maybeSingle()

    const result: UserProfile = {
      id: userId,
      email: data?.email || '',
      name: data?.name || null,
      targetYear: data?.target_year || null,
      remindersEnabled: data?.reminders_enabled ?? true,
    }

    return jsonResponse(result)
  } catch (e: any) {
    const msg = e.message || 'Failed to fetch profile'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const body = await request.json()
    const { name, targetYear, remindersEnabled } = body

    const token = getTokenFromRequest(request)!
    const authClient = createServerClient(token)
    const { data: authData } = await authClient.auth.getUser(token)
    const email = authData?.user?.email || ''

    const db = await getUserClient(request)

    const row = {
      id: userId,
      email,
      name: name || null,
      target_year: targetYear || null,
      reminders_enabled: remindersEnabled ?? true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await db
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select('id, email, name, target_year, reminders_enabled')
      .single()

    if (error) {
      return errorResponse('Failed to save: ' + error.message, 500)
    }

    return jsonResponse({
      id: data.id,
      email: data.email,
      name: data.name,
      targetYear: data.target_year,
      remindersEnabled: data.reminders_enabled,
    })
  } catch (e: any) {
    const msg = e.message || 'Failed to update profile'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}
