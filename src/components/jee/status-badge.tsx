import { cn } from '@/lib/utils'
import {
  STATUS_META,
  SUBJECT_META,
  type ChapterStatus,
  type Subject,
} from '@/lib/constants'

export function StatusBadge({
  status,
  className,
}: {
  status: ChapterStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        color: meta.token,
        backgroundColor: `color-mix(in oklab, ${meta.token} 14%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.token }}
      />
      {meta.label}
    </span>
  )
}

export function SubjectBadge({
  subject,
  className,
}: {
  subject: Subject
  className?: string
}) {
  const meta = SUBJECT_META[subject]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        color: meta.token,
        backgroundColor: `color-mix(in oklab, ${meta.token} 14%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.token }}
      />
      {meta.label}
    </span>
  )
}

export function SubjectDot({ subject }: { subject: Subject }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: SUBJECT_META[subject].token }}
      aria-hidden
    />
  )
}
