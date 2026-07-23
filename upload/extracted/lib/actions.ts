'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  nextRevisionDate,
  type ChapterStatus,
  type Subject,
  type TestType,
} from '@/lib/constants'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

/* ----------------------------- Chapters ----------------------------- */

export async function updateChapterStatus(
  chapterId: string,
  status: ChapterStatus,
) {
  const { supabase, user } = await requireUser()

  const now = new Date()
  const schedulesRevision = status === 'completed' || status === 'revision'

  const { error } = await supabase.from('chapter_progress').upsert(
    {
      user_id: user.id,
      chapter_id: chapterId,
      status,
      last_revised_at: schedulesRevision ? now.toISOString() : null,
      next_revision_at: schedulesRevision ? nextRevisionDate(now, 0) : null,
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id,chapter_id' },
  )

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/syllabus')
}

export async function markChapterRevised(chapterId: string) {
  const { supabase, user } = await requireUser()
  const now = new Date()

  const { error } = await supabase.from('chapter_progress').upsert(
    {
      user_id: user.id,
      chapter_id: chapterId,
      status: 'revision',
      last_revised_at: now.toISOString(),
      next_revision_at: nextRevisionDate(now, 1),
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id,chapter_id' },
  )

  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/syllabus')
}

export async function updateChapterNotes(chapterId: string, notes: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase.from('chapter_progress').upsert(
    {
      user_id: user.id,
      chapter_id: chapterId,
      notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,chapter_id' },
  )

  if (error) throw new Error(error.message)
  revalidatePath('/syllabus')
}

/* ----------------------------- Schedules ----------------------------- */

export async function createSchedule(input: {
  title: string
  subject: Subject | 'General'
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  notes?: string | null
}) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase.from('schedules').insert({
    user_id: user.id,
    title: input.title,
    subject: input.subject,
    scheduled_date: input.scheduled_date,
    start_time: input.start_time || null,
    end_time: input.end_time || null,
    notes: input.notes || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/')
}

export async function toggleSchedule(id: string, isDone: boolean) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('schedules')
    .update({ is_done: isDone })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/')
}

export async function deleteSchedule(id: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/')
}

/* ------------------------------- Tests ------------------------------- */

export async function createTest(input: {
  name: string
  test_type: TestType
  test_date: string
  total_marks: number
  obtained_marks: number
  rank?: number | null
  percentile?: number | null
  notes?: string | null
  sections: {
    subject: Subject
    correct: number
    incorrect: number
    unattempted: number
    marks: number
    max_marks: number
  }[]
}) {
  const { supabase, user } = await requireUser()

  const { data: test, error } = await supabase
    .from('tests')
    .insert({
      user_id: user.id,
      name: input.name,
      test_type: input.test_type,
      test_date: input.test_date,
      total_marks: input.total_marks,
      obtained_marks: input.obtained_marks,
      rank: input.rank ?? null,
      percentile: input.percentile ?? null,
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  if (input.sections.length > 0) {
    const { error: sectionError } = await supabase.from('test_sections').insert(
      input.sections.map((s) => ({
        test_id: test.id,
        user_id: user.id,
        subject: s.subject,
        correct: s.correct,
        incorrect: s.incorrect,
        unattempted: s.unattempted,
        marks: s.marks,
        max_marks: s.max_marks,
      })),
    )
    if (sectionError) throw new Error(sectionError.message)
  }

  revalidatePath('/tests')
  revalidatePath('/')
}

export async function deleteTest(id: string) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/tests')
  revalidatePath('/')
}

/* ------------------------------ Profile ------------------------------ */

export async function updateProfile(input: {
  full_name: string
  target_year: number | null
  reminders_enabled: boolean
}) {
  const { supabase, user } = await requireUser()

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: input.full_name,
      target_year: input.target_year,
      reminders_enabled: input.reminders_enabled,
    },
    { onConflict: 'id' },
  )

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
