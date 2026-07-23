import { getDb, jsonResponse, errorResponse } from '@/lib/supabase'
import type { Schedule } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const { data, error } = await db
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) return errorResponse('Failed to fetch schedules: ' + error.message, 500)

    return jsonResponse((data || []).map((r: any) => ({
      id: r.id, userId: r.user_id, title: r.title, subject: r.subject,
      scheduledDate: r.scheduled_date, startTime: r.start_time, endTime: r.end_time,
      notes: r.notes, isDone: r.is_done, createdAt: r.created_at,
    })))
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to fetch schedules', 500)
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const { title, subject, scheduledDate, startTime, endTime, notes } = await request.json()
    if (!title || !scheduledDate) return errorResponse('Title and date required')

    const { data, error } = await db
      .from('schedules')
      .insert({
        user_id: user.id, title, subject: subject || null,
        scheduled_date: scheduledDate, start_time: startTime || null,
        end_time: endTime || null, notes: notes || null,
      })
      .select('id').single()

    if (error) return errorResponse('Failed to create schedule: ' + error.message, 500)
    return jsonResponse({ id: data.id }, 201)
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to create schedule', 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return errorResponse('id required')

    const { error } = await db.from('schedules').delete().eq('id', id).eq('user_id', user.id)
    if (error) return errorResponse('Failed to delete: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to delete', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const { id, isDone } = await request.json()
    if (!id) return errorResponse('id required')

    const { error } = await db.from('schedules').update({ is_done: isDone }).eq('id', id).eq('user_id', user.id)
    if (error) return errorResponse('Failed to update: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to update', 500)
  }
}