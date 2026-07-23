import { getDb, jsonResponse, errorResponse } from '@/lib/supabase'
import type { ChapterWithProgress, ChapterStatus } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const db = await getDb(request)
    const token = request.headers.get('authorization')?.replace('Bearer ', '')!

    // Get user ID from the validated client
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return errorResponse('Not authenticated', 401)
    const userId = user.id

    const { data: chapters, error: chErr } = await db
      .from('chapters')
      .select('*')
      .order('subject', { ascending: true })
      .order('grade', { ascending: true })
      .order('sort_order', { ascending: true })

    if (chErr) return errorResponse('Failed to fetch chapters: ' + chErr.message, 500)

    const { data: progress, error: pErr } = await db
      .from('chapter_progress')
      .select('*')
      .eq('user_id', userId)

    if (pErr) return errorResponse('Failed to fetch progress: ' + pErr.message, 500)

    const progressMap = new Map(progress?.map((p: any) => [p.chapter_id, p]) || [])

    const result: ChapterWithProgress[] = (chapters || []).map((c: any) => {
      const p = progressMap.get(c.id)
      return {
        id: c.id,
        subject: c.subject as ChapterWithProgress['subject'],
        grade: c.grade as 11 | 12,
        name: c.name,
        sortOrder: c.sort_order,
        status: (p?.status as ChapterStatus) || 'incomplete',
        lastRevisedAt: p?.last_revised_at?.toISOString() || null,
        nextRevisionAt: p?.next_revision_at || null,
        notes: p?.notes || null,
      }
    })

    return jsonResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || 'Failed to fetch chapters', 500)
  }
}