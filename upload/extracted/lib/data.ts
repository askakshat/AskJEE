import { createClient } from '@/lib/supabase/server'
import type {
  Chapter,
  ChapterProgress,
  ChapterWithProgress,
  Profile,
  Schedule,
  Test,
  TestSection,
  TestWithSections,
} from '@/lib/types'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Profile) ?? null
}

export async function getChaptersWithProgress(): Promise<ChapterWithProgress[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: chapters }, { data: progress }] = await Promise.all([
    supabase
      .from('chapters')
      .select('*')
      .order('subject', { ascending: true })
      .order('grade', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase.from('chapter_progress').select('*').eq('user_id', user.id),
  ])

  const progressMap = new Map<string, ChapterProgress>()
  for (const p of (progress as ChapterProgress[]) ?? []) {
    progressMap.set(p.chapter_id, p)
  }

  return ((chapters as Chapter[]) ?? []).map((c) => {
    const p = progressMap.get(c.id)
    return {
      ...c,
      status: p?.status ?? 'incomplete',
      last_revised_at: p?.last_revised_at ?? null,
      next_revision_at: p?.next_revision_at ?? null,
      notes: p?.notes ?? null,
    }
  })
}

export async function getSchedules(): Promise<Schedule[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })

  return (data as Schedule[]) ?? []
}

export async function getTests(): Promise<TestWithSections[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: tests }, { data: sections }] = await Promise.all([
    supabase
      .from('tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false }),
    supabase.from('test_sections').select('*').eq('user_id', user.id),
  ])

  const sectionMap = new Map<string, TestSection[]>()
  for (const s of (sections as TestSection[]) ?? []) {
    const arr = sectionMap.get(s.test_id) ?? []
    arr.push(s)
    sectionMap.set(s.test_id, arr)
  }

  return ((tests as Test[]) ?? []).map((t) => ({
    ...t,
    sections: sectionMap.get(t.id) ?? [],
  }))
}
