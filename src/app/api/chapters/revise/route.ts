import { getUserId, getUserClient, jsonResponse, errorResponse } from '@/lib/supabase'
import { REVISION_INTERVALS_DAYS } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const { chapterId } = await request.json()
    if (!chapterId) return errorResponse('chapterId required')

    const db = await getUserClient(request)

    // Get current progress to determine revision stage
    const { data: current } = await db
      .from('chapter_progress')
      .select('next_revision_at')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .maybeSingle()

    // Determine next interval
    let stage = 0
    if (current?.next_revision_at) {
      const prev = new Date(current.next_revision_at)
      const diff = Math.round((Date.now() - prev.getTime()) / 86400000)
      for (let i = REVISION_INTERVALS_DAYS.length - 1; i >= 0; i--) {
        if (diff >= REVISION_INTERVALS_DAYS[i] - 2) { stage = i + 1; break }
      }
    }

    const now = new Date()
    const days = REVISION_INTERVALS_DAYS[Math.min(stage, REVISION_INTERVALS_DAYS.length - 1)]
    const nextDate = new Date(now.getTime() + days * 86400000)

    const { error } = await db
      .from('chapter_progress')
      .upsert({
        user_id: userId,
        chapter_id: chapterId,
        status: 'revision',
        last_revised_at: now.toISOString(),
        next_revision_at: nextDate.toISOString().slice(0, 10),
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    if (error) return errorResponse('Failed to log revision: ' + error.message, 500)
    return jsonResponse({ ok: true })
  } catch (e: any) {
    const msg = e.message || 'Failed to log revision'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}
