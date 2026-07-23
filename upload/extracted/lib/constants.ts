export type Subject = 'Physics' | 'Chemistry' | 'Mathematics'
export type ChapterStatus =
  | 'completed'
  | 'in_progress'
  | 'revision'
  | 'incomplete'
  | 'backlog'

export const SUBJECTS: Subject[] = ['Physics', 'Chemistry', 'Mathematics']

export const SUBJECT_META: Record<
  Subject,
  { label: string; short: string; token: string; textClass: string; bgClass: string }
> = {
  Physics: {
    label: 'Physics',
    short: 'PHY',
    token: 'var(--subject-physics)',
    textClass: 'text-[var(--subject-physics)]',
    bgClass: 'bg-[var(--subject-physics)]',
  },
  Chemistry: {
    label: 'Chemistry',
    short: 'CHE',
    token: 'var(--subject-chemistry)',
    textClass: 'text-[var(--subject-chemistry)]',
    bgClass: 'bg-[var(--subject-chemistry)]',
  },
  Mathematics: {
    label: 'Mathematics',
    short: 'MAT',
    token: 'var(--subject-maths)',
    textClass: 'text-[var(--subject-maths)]',
    bgClass: 'bg-[var(--subject-maths)]',
  },
}

export const STATUS_META: Record<
  ChapterStatus,
  { label: string; token: string; description: string; order: number }
> = {
  completed: {
    label: 'Completed',
    token: 'var(--status-completed)',
    description: 'Studied and confident',
    order: 1,
  },
  revision: {
    label: 'Revision',
    token: 'var(--status-revision)',
    description: 'Needs periodic revision',
    order: 2,
  },
  in_progress: {
    label: 'In Progress',
    token: 'var(--status-progress)',
    description: 'Currently studying',
    order: 3,
  },
  incomplete: {
    label: 'Incomplete',
    token: 'var(--status-incomplete)',
    description: 'Not started yet',
    order: 4,
  },
  backlog: {
    label: 'Backlog',
    token: 'var(--status-backlog)',
    description: 'Pending / falling behind',
    order: 5,
  },
}

export const STATUS_ORDER: ChapterStatus[] = [
  'completed',
  'revision',
  'in_progress',
  'incomplete',
  'backlog',
]

// Spaced-repetition intervals (in days) used to schedule the next revision.
export const REVISION_INTERVALS_DAYS = [3, 7, 16, 35]

export function nextRevisionDate(from: Date = new Date(), stage = 0): string {
  const days =
    REVISION_INTERVALS_DAYS[Math.min(stage, REVISION_INTERVALS_DAYS.length - 1)]
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const TEST_TYPES = [
  'Mock',
  'Chapter',
  'Full Syllabus',
  'Previous Year',
  'Other',
] as const
export type TestType = (typeof TEST_TYPES)[number]
