import type { ChapterStatus, Subject, TestType } from './constants'

export interface Chapter {
  id: string
  subject: Subject
  grade: number
  name: string
  sortOrder: number
}

export interface ChapterProgress {
  id: string
  userId: string
  chapterId: string
  status: ChapterStatus
  lastRevisedAt: string | null
  nextRevisionAt: string | null
  notes: string | null
  updatedAt: string
}

export interface ChapterWithProgress extends Chapter {
  status: ChapterStatus
  lastRevisedAt: string | null
  nextRevisionAt: string | null
  notes: string | null
}

export interface Schedule {
  id: string
  userId: string
  title: string
  subject: Subject | 'General' | null
  scheduledDate: string
  startTime: string | null
  endTime: string | null
  notes: string | null
  isDone: boolean
  createdAt: string
}

export interface TestSection {
  id: string
  testId: string
  userId: string
  subject: Subject
  correct: number
  incorrect: number
  unattempted: number
  marks: number
  maxMarks: number
}

export interface Test {
  id: string
  userId: string
  name: string
  testType: TestType
  testDate: string
  totalMarks: number
  obtainedMarks: number
  rank: number | null
  percentile: number | null
  notes: string | null
  createdAt: string
}

export interface TestWithSections extends Test {
  sections: TestSection[]
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  targetYear: number | null
  remindersEnabled: boolean
}

export interface AuthState {
  user: UserProfile | null
  isLoading: boolean
}
