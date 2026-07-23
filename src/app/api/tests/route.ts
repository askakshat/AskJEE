import { getUserId, getUserClient, jsonResponse, errorResponse } from '@/lib/supabase'
import type { TestWithSections, TestSection, Subject, TestType } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const db = await getUserClient(request)

    const [testsRes, sectionsRes] = await Promise.all([
      db.from('tests').select('*').eq('user_id', userId).order('test_date', { ascending: false }),
      db.from('test_sections').select('*').eq('user_id', userId),
    ])

    if (testsRes.error) return errorResponse('Failed to fetch tests', 500)

    const sectionMap = new Map<string, TestSection[]>()
    for (const s of (sectionsRes.data || []) as any[]) {
      const arr = sectionMap.get(s.test_id) ?? []
      arr.push({
        id: s.id, testId: s.test_id, userId: s.user_id,
        subject: s.subject as Subject,
        correct: s.correct, incorrect: s.incorrect, unattempted: s.unattempted,
        marks: Number(s.marks), maxMarks: Number(s.max_marks),
      })
      sectionMap.set(s.test_id, arr)
    }

    const result: TestWithSections[] = (testsRes.data || []).map((t: any) => ({
      id: t.id, userId: t.user_id, name: t.name,
      testType: t.test_type as TestType, testDate: t.test_date,
      totalMarks: Number(t.total_marks), obtainedMarks: Number(t.obtained_marks),
      rank: t.rank, percentile: t.percentile ? Number(t.percentile) : null,
      notes: t.notes, createdAt: t.created_at,
      sections: sectionMap.get(t.id) ?? [],
    }))

    return jsonResponse(result)
  } catch (e: any) {
    const msg = e.message || 'Failed to fetch tests'
    return errorResponse(msg, msg.includes('Not authenticated') || msg.includes('token') ? 401 : 500)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) return errorResponse('Not authenticated', 401)

    const {
      name, testType, testDate, totalMarks, obtainedMarks,
      rank, percentile, notes, sections,
    } = await request.json()

    if (!name || !testDate || totalMarks == null || obtainedMarks == null)
      return errorResponse('name, testDate, totalMarks, obtainedMarks required')

    const db = await getUserClient(request)

    const { data: test, error: tErr } = await db
      .from('tests')
      .insert({
        user_id: userId, name, test_type: testType || 'Other', test_date: testDate,
        total_marks: totalMarks, obtained_marks: obtainedMarks,
        rank: rank ?? null, percentile: percentile ?? null, notes: notes || null,
      })
      .select('id')
      .single()

    if (tErr) return errorResponse('Failed to create test: ' + tErr.message, 500)

    if (sections?.length > 0) {
      const sectionRows = sections.map((s: any) => ({
        test_id: test.id, user_id: userId, subject: s.subject,
        correct: s.correct || 0, incorrect: s.incorrect || 0, unattempted: s.unattempted || 0,
        marks: s.marks || 0, max_marks: s.max_marks || 0,
      }))
      const { error: sErr } = await db.from('test_sections').insert(sectionRows)
      if (sErr) return errorResponse('Failed to create sections: ' + sErr.message, 500)
    }

    return jsonResponse({ id: test.id }, 201)
  } catch (e: any) {
    const msg = e.message || 'Failed to create test'
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
      .from('tests')
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
