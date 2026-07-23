import { getDb, jsonResponse, errorResponse } from '@/lib/supabase'
import { nextRevisionDate, type ChapterStatus } from '@/lib/constants'

export async function PUT(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!
    
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)

    const { chapterId, status } = await request.json()
    if (!chapterId || !status) return errorResponse('chapterId and status required')

    const now = new Date()
    const schedulesRevision = status === 'completed' || status === 'revision'
    
    // Explicitly handle Date serialization for Supabase
    const nextRev = schedulesRevision ? nextRevisionDate(now, 0) : null;
    const formattedNextRev = nextRev instanceof Date ? nextRev.toISOString() : nextRev;

    const { error } = await db
      .from('chapter_progress')
      .upsert({
        user_id: user.id,
        chapter_id: chapterId,
        status: status as ChapterStatus,
        last_revised_at: schedulesRevision ? now.toISOString() : null,
        next_revision_at: formattedNextRev,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id,chapter_id' })

    if (error) {
      console.error('[Supabase Upsert Error] /api/chapters/progress:', error);
      return errorResponse('Failed to update progress: ' + error.message, 500)
    }
    
    return jsonResponse({ ok: true })
  } catch (e: any) {
    console.error('[Route Try/Catch Error] /api/chapters/progress:', e);
    return errorResponse(e.message || 'Failed to update progress', 500)
  }
}