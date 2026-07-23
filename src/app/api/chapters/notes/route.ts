import { getUserId, getUserClient, jsonResponse, errorResponse } from '@/lib/supabase'

export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const { chapterId, notes } = await request.json()
    if (!chapterId) return errorResponse('chapterId required')

    const db = await getUserClient(request)

    const { error } = await db
      .from('chapter_progress')
      .upsert({
        user_id: userId,
        chapter_id: chapterId,
        status: 'incomplete',
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    if (error) return errorResponse('Failed to save notes: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    const msg = e.message || 'Failed to save notes'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}
