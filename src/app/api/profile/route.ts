import { getDb, getTokenFromRequest, createServerClient, jsonResponse, errorResponse } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const db = await getDb(request)
    const token = getTokenFromRequest(request)!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const { data } = await db
      .from('profiles')
      .select('id, email, name, target_year, reminders_enabled')
      .eq('id', user.id)
      .maybeSingle()

    return jsonResponse({
      id: user.id,
      email: data?.email || user.email || '',
      name: data?.name || null,
      targetYear: data?.target_year || null,
      remindersEnabled: data?.reminders_enabled ?? true,
    })
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to fetch profile', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDb(request)
    const token = getTokenFromRequest(request)!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const body = await request.json()
    const { name, targetYear, remindersEnabled } = body

    const { data, error } = await db
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name: name || null,
        target_year: targetYear || null,
        reminders_enabled: remindersEnabled ?? true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id, email, name, target_year, reminders_enabled')
      .single()

    if (error) return errorResponse('Failed to save: ' + error.message, 500)

    return jsonResponse({
      id: data.id,
      email: data.email,
      name: data.name,
      targetYear: data.target_year,
      remindersEnabled: data.reminders_enabled,
    })
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to update profile', 500)
  }
}