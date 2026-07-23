import type { ChapterStatus, Subject, TestType } from './constants'

export interface Profile {
  id: string
  full_name: string | null
  target_year: number | null
  reminders_enabled: boolean
  created_at: string
}

export interface Chapter {
  id: string
  subject: Subject
  grade: 11 | 12
  name: string
  sort_order: number
}

export interface ChapterProgress {
  id: string
  user_id: string
  chapter_id: string
  status: ChapterStatus
  last_revised_at: string | null
  next_revision_at: string | null
  notes: string | null
  updated_at: string
}

// A chapter joined with the current user's progress row (if any).
export interface ChapterWithProgress extends Chapter {
  status: ChapterStatus
  last_revised_at: string | null
  next_revision_at: string | null
  notes: string | null
}

export interface Schedule {
  id: string
  user_id: string
  title: string
  subject: Subject | 'General' | null
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
  is_done: boolean
  created_at: string
}

export interface TestSection {
  id: string
  test_id: string
  user_id: string
  subject: Subject
  correct: number
  incorrect: number
  unattempted: number
  marks: number
  max_marks: number
}

export interface Test {
  id: string
  user_id: string
  name: string
  test_type: TestType
  test_date: string
  total_marks: number
  obtained_marks: number
  rank: number | null
  percentile: number | null
  notes: string | null
  created_at: string
}

export interface TestWithSections extends Test {
  sections: TestSection[]
}
