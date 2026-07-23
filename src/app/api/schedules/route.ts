import { getUserId, getUserClient, jsonResponse, errorResponse } from '@/lib/supabase'
import type { Schedule } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const db = await getUserClient(request)

    const { data, error } = await db
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) return errorResponse('Failed to fetch schedules', 500)

    const result: Schedule[] = (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      subject: r.subject,
      scheduledDate: r.scheduled_date,
      startTime: r.start_time,
      endTime: r.end_time,
      notes: r.notes,
      isDone: r.is_done,
      createdAt: r.created_at,
    }))

    return jsonResponse(result)
  } catch (e: any) {
    const msg = e.message || 'Failed to fetch schedules'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const { title, subject, scheduledDate, startTime, endTime, notes } = await request.json()
    if (!title || !scheduledDate) return errorResponse('Title and date required')

    const db = await getUserClient(request)

    const { data, error } = await db
      .from('schedules')
      .insert({
        user_id: userId,
        title,
        subject: subject || null,
        scheduled_date: scheduledDate,
        start_time: startTime || null,
        end_time: endTime || null,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) return errorResponse('Failed to create schedule: ' + error.message, 500)
    return jsonResponse({ id: data.id }, 201)
  } catch (e: any) {
    const msg = e.message || 'Failed to create schedule'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return errorResponse('id required')

    const db = await getUserClient(request)

    const { error } = await db
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return errorResponse('Failed to delete: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    const msg = e.message || 'Failed to delete'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const { id, isDone } = await request.json()
    if (!id) return errorResponse('id required')

    const db = await getUserClient(request)

    const { error } = await db
      .from('schedules')
      .update({ is_done: isDone })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) return errorResponse('Failed to update: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    const msg = e.message || 'Failed to update'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}
