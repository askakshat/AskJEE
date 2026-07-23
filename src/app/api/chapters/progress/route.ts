import { getUserId, getUserClient, jsonResponse, errorResponse } from '@/lib/supabase'
import { nextRevisionDate, type ChapterStatus } from '@/lib/constants'

export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const { chapterId, status } = await request.json()
    if (!chapterId || !status) return errorResponse('chapterId and status required')

    const db = await getUserClient(request)
    const now = new Date()
    const schedulesRevision = status === 'completed' || status === 'revision'

    const { error } = await db
      .from('chapter_progress')
      .upsert({
        user_id: userId,
        chapter_id: chapterId,
        status: status as ChapterStatus,
        last_revised_at: schedulesRevision ? now.toISOString() : null,
        next_revision_at: schedulesRevision ? nextRevisionDate(now, 0) : null,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    if (error) return errorResponse('Failed to update progress: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    const msg = e.message || 'Failed to update progress'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}
