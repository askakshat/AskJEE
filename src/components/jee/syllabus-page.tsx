'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { RotateCcw, StickyNote, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  SUBJECTS,
  SUBJECT_META,
  STATUS_META,
  STATUS_ORDER,
  type ChapterStatus,
  type Subject,
} from '@/lib/constants'
import type { ChapterWithProgress } from '@/lib/types'
import { formatDate, relativeDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StatusPicker } from '@/components/jee/status-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function getToken() {
  return localStorage.getItem('jee_token')
}

type GradeFilter = 'all' | 11 | 12

export function SyllabusPage() {
  const [chapters, setChapters] = useState<ChapterWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState<'all' | Subject>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ChapterStatus>('all')
  const [notesFor, setNotesFor] = useState<ChapterWithProgress | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch('/api/chapters', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`Chapters API failed: ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setChapters(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load chapters:', err)
        toast.error('Failed to load chapters. Check Supabase tables.')
        setLoading(false)
      })
  }, [])

  const counts = useMemo(() => {
    const c: Record<ChapterStatus, number> = {
      completed: 0,
      in_progress: 0,
      revision: 0,
      incomplete: 0,
      backlog: 0,
    }
    for (const ch of chapters) c[ch.status]++
    return c
  }, [chapters])

  const visible = useMemo(() => {
    return chapters.filter((c) => {
      if (subjectFilter !== 'all' && c.subject !== subjectFilter) return false
      if (gradeFilter !== 'all' && c.grade !== gradeFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      return true
    })
  }, [chapters, subjectFilter, gradeFilter, statusFilter])

  const grouped = useMemo(() => {
    return SUBJECTS.map((subject) => ({
      subject,
      chapters: visible.filter((c) => c.subject === subject),
    })).filter((g) => g.chapters.length > 0)
  }, [visible])

  const applyStatus = useCallback(
    async (chapterId: string, status: ChapterStatus) => {
      const prev = [...chapters]
      const now = new Date()
      const revises = status === 'completed' || status === 'revision'
      setChapters((cs) =>
        cs.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                status,
                lastRevisedAt: revises ? now.toISOString() : c.lastRevisedAt,
                nextRevisionAt: revises
                  ? new Date(now.getTime() + 3 * 86400000)
                      .toISOString()
                      .slice(0, 10)
                  : null,
              }
            : c,
        ),
      )
      try {
        const token = getToken()
        const res = await fetch('/api/chapters/progress', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chapterId, status }),
        })
        if (!res.ok) throw new Error()
        toast.success(`Marked as ${STATUS_META[status].label}`)
      } catch {
        setChapters(prev)
        toast.error('Could not update status')
      }
    },
    [chapters],
  )

  const revise = useCallback(async (chapterId: string) => {
    try {
      const token = getToken()
      const res = await fetch('/api/chapters/revise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chapterId }),
      })
      if (!res.ok) throw new Error()
      const now = new Date()
      setChapters((cs) =>
        cs.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                status: 'revision',
                lastRevisedAt: now.toISOString(),
                nextRevisionAt: new Date(now.getTime() + 7 * 86400000)
                  .toISOString()
                  .slice(0, 10),
              }
            : c,
        ),
      )
      toast.success('Revision logged. Next reminder scheduled.')
    } catch {
      toast.error('Could not log revision')
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          Syllabus Tracker
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Mark each chapter&apos;s status across Class 11 and 12. Completed and
          revision chapters are automatically queued for spaced revision.
        </p>
      </header>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() =>
              setStatusFilter((f) => (f === s ? 'all' : s))
            }
            className={cn(
              'rounded-xl border bg-card p-3 text-left transition-colors',
              statusFilter === s
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:bg-accent/50',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: STATUS_META[s].token }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {STATUS_META[s].label}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterGroup
          options={[
            { value: 'all', label: 'All subjects' },
            ...SUBJECTS.map((s) => ({ value: s, label: s })),
          ]}
          value={subjectFilter}
          onChange={(v) => setSubjectFilter(v as 'all' | Subject)}
        />
        <FilterGroup
          options={[
            { value: 'all', label: 'All classes' },
            { value: 11, label: 'Class 11' },
            { value: 12, label: 'Class 12' },
          ]}
          value={gradeFilter}
          onChange={(v) => setGradeFilter(v as GradeFilter)}
        />
        {statusFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Clear status: {STATUS_META[statusFilter].label}
          </Button>
        )}
      </div>

      {/* Grouped chapters */}
      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No chapters match these filters.
        </p>
      ) : (
        grouped.map(({ subject, chapters: subjectChapters }) => {
          const meta = SUBJECT_META[subject]
          const done = subjectChapters.filter(
            (c) => c.status === 'completed',
          ).length
          const pct = Math.round((done / subjectChapters.length) * 100)
          return (
            <Card key={subject} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: meta.token }}
                  />
                  <h2 className="text-base font-semibold">{subject}</h2>
                  <span className="text-sm text-muted-foreground">
                    {subjectChapters.length} chapters
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: meta.token,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {pct}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {subjectChapters.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {c.grade}th
                        </span>
                        <p className="truncate font-medium">{c.name}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {c.lastRevisedAt && (
                          <span>
                            Revised {formatDate(c.lastRevisedAt)}
                          </span>
                        )}
                        {c.nextRevisionAt &&
                          (c.status === 'revision' ||
                            c.status === 'completed') && (
                            <span
                              className={cn(
                                relativeDay(c.nextRevisionAt)?.includes(
                                  'overdue',
                                ) && 'font-medium text-destructive',
                              )}
                            >
                              Next revision: {relativeDay(c.nextRevisionAt)}
                            </span>
                          )}
                        {c.notes && (
                          <span className="inline-flex items-center gap-1">
                            <StickyNote className="size-3" /> Note
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {(c.status === 'revision' ||
                        c.status === 'completed') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Log revision"
                          title="Log a revision now"
                          onClick={() => revise(c.id)}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit note"
                        onClick={() => setNotesFor(c)}
                      >
                        <StickyNote className="size-4" />
                      </Button>
                      <StatusPicker
                        value={c.status}
                        onChange={(s) => applyStatus(c.id, s)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })
      )}

      <NotesDialog
        chapter={notesFor}
        onClose={() => setNotesFor(null)}
        onSaved={(id, notes) =>
          setChapters((cs) =>
            cs.map((c) => (c.id === id ? { ...c, notes } : c)),
          )
        }
      />
    </div>
  )
}

function FilterGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === o.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NotesDialog({
  chapter,
  onClose,
  onSaved,
}: {
  chapter: ChapterWithProgress | null
  onClose: () => void
  onSaved: (id: string, notes: string) => void
}) {
  const [value, setValue] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [openFor, setOpenFor] = useState<string | null>(null)

  if (chapter && openFor !== chapter.id) {
    setOpenFor(chapter.id)
    setValue(chapter.notes ?? '')
  }

  function save() {
    if (!chapter) return
    setIsPending(true)
    const token = getToken()
    fetch('/api/chapters/notes', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chapterId: chapter.id, notes: value }),
    })
      .then((r) => {
        if (!r.ok) throw new Error()
        onSaved(chapter.id, value)
        toast.success('Note saved')
        onClose()
        setOpenFor(null)
      })
      .catch(() => toast.error('Could not save note'))
      .finally(() => setIsPending(false))
  }

  return (
    <Dialog
      open={!!chapter}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
          setOpenFor(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chapter note</DialogTitle>
          <DialogDescription>{chapter?.name}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Formulas to remember, weak topics, reference problems..."
          rows={6}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}