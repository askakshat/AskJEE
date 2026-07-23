import { getDb, jsonResponse, errorResponse } from '@/lib/supabase'

export async function PUT(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const { chapterId, notes } = await request.json()
    if (!chapterId) return errorResponse('chapterId required')

    const { error } = await db
      .from('chapter_progress')
      .upsert({
        user_id: user.id,
        chapter_id: chapterId,
        status: 'incomplete',
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    if (error) return errorResponse('Failed to save notes: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to save notes', 500)
  }
}