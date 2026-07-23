'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, BookOpen, Clock, Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { SUBJECTS, SUBJECT_META, STATUS_ORDER, STATUS_META, type ChapterWithProgress } from '@/lib/constants'
import type { Schedule, TestWithSections } from '@/lib/types'
import { formatDate, formatTime, relativeDay, todayISO } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function getToken() {
  return localStorage.getItem('jee_token')
}

function apiFetch<T>(url: string): Promise<T> {
  const token = getToken()
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((r) => (r.ok ? r.json() : ([] as T)))
}

export function DashboardPage() {
  const [chapters, setChapters] = useState<ChapterWithProgress[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [tests, setTests] = useState<TestWithSections[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<ChapterWithProgress[]>('/api/chapters'),
      apiFetch<Schedule[]>('/api/schedules'),
      apiFetch<TestWithSections[]>('/api/tests'),
    ]).then(([c, s, t]) => {
      setChapters(c)
      setSchedules(s)
      setTests(t)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const total = chapters.length
    const completed = chapters.filter((c) => c.status === 'completed').length
    const inProgress = chapters.filter((c) => c.status === 'in_progress').length
    const revision = chapters.filter((c) => c.status === 'revision').length
    const backlog = chapters.filter((c) => c.status === 'backlog').length

    const subjectStats = SUBJECTS.map((sub) => {
      const subChapters = chapters.filter((c) => c.subject === sub)
      const subDone = subChapters.filter((c) => c.status === 'completed').length
      return {
        subject: sub,
        total: subChapters.length,
        done: subDone,
        pct: subChapters.length > 0 ? Math.round((subDone / subChapters.length) * 100) : 0,
      }
    })

    const dueRevision = chapters.filter(
      (c) =>
        (c.status === 'revision' || c.status === 'completed') &&
        c.nextRevisionAt &&
        c.nextRevisionAt <= todayISO(),
    )

    const upcomingRevision = chapters.filter(
      (c) =>
        (c.status === 'revision' || c.status === 'completed') &&
        c.nextRevisionAt &&
        c.nextRevisionAt > todayISO(),
    ).sort((a, b) => (a.nextRevisionAt || '').localeCompare(b.nextRevisionAt || ''))

    const today = todayISO()
    const todaySchedule = schedules
      .filter((s) => s.scheduledDate === today)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

    const recentTests = tests.slice(0, 5)

    const avgScore =
      tests.length > 0
        ? Math.round(tests.reduce((s, t) => s + (t.obtainedMarks / t.totalMarks) * 100, 0) / tests.length)
        : 0

    const bestScore =
      tests.length > 0
        ? Math.round(
            Math.max(...tests.map((t) => (t.obtainedMarks / t.totalMarks) * 100)),
          )
        : 0

    return {
      total, completed, inProgress, revision, backlog,
      subjectStats, dueRevision, upcomingRevision,
      todaySchedule, recentTests, avgScore, bestScore,
    }
  }, [chapters, schedules, tests])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const overallPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your JEE preparation progress
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completed"
          value={stats.completed}
          sub={`of ${stats.total} chapters`}
          icon={<CheckCircle2 className="size-4" />}
          color="var(--status-completed)"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          sub={`${stats.revision} in revision`}
          icon={<BookOpen className="size-4" />}
          color="var(--status-progress)"
        />
        <StatCard
          label="Avg. Test Score"
          value={`${stats.avgScore}%`}
          sub={`Best: ${stats.bestScore}%`}
          icon={<Target className="size-4" />}
          color="var(--chart-2)"
        />
        <StatCard
          label="Backlog"
          value={stats.backlog}
          sub={stats.dueRevision.length > 0 ? `${stats.dueRevision.length} revisions due` : 'No overdue revisions'}
          icon={<AlertTriangle className="size-4" />}
          color="var(--status-backlog)"
        />
      </div>

      {/* Overall progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Overall Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">All Subjects</span>
              <span className="tabular-nums font-semibold">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.subjectStats.map((s) => {
              const meta = SUBJECT_META[s.subject]
              return (
                <div key={s.subject}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.token }} />
                      {meta.short}
                    </span>
                    <span className="tabular-nums font-medium">{s.pct}%</span>
                  </div>
                  <Progress value={s.pct} className="h-2" />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.done}/{s.total} chapters
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revisions + Today's schedule */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="size-4" />
              Revision Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dueRevision.length === 0 && stats.upcomingRevision.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revisions scheduled yet. Mark chapters as completed or revision to get started.</p>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {stats.dueRevision.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-destructive">{relativeDay(c.nextRevisionAt)} &middot; {c.subject} {c.grade}th</p>
                    </div>
                  </div>
                ))}
                {stats.upcomingRevision.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
                    <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{relativeDay(c.nextRevisionAt)} &middot; {c.subject} {c.grade}th</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todaySchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled for today. Add tasks in the Schedule tab.</p>
            ) : (
              <div className="space-y-1.5">
                {stats.todaySchedule.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${s.isDone ? 'opacity-60' : ''}`}
                  >
                    <span className={`size-2 shrink-0 rounded-full ${s.isDone ? 'bg-muted-foreground' : (s.subject ? SUBJECT_META[s.subject as keyof typeof SUBJECT_META]?.bgClass : 'bg-primary')}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate ${s.isDone ? 'line-through' : ''}`}>{s.title}</p>
                      {s.startTime && (
                        <p className="text-xs text-muted-foreground">{formatTime(s.startTime)}{s.endTime ? ` - ${formatTime(s.endTime)}` : ''}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tests recorded yet. Add your scores in the Tests tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Test</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium text-right">Score</th>
                    <th className="pb-2 font-medium text-right">%</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recentTests.map((t) => {
                    const pct = Math.round((t.obtainedMarks / t.totalMarks) * 100)
                    return (
                      <tr key={t.id}>
                        <td className="py-2 font-medium">{t.name}</td>
                        <td className="py-2 text-muted-foreground">{t.testType}</td>
                        <td className="py-2 text-right tabular-nums">{t.obtainedMarks}/{t.totalMarks}</td>
                        <td className={`py-2 text-right tabular-nums font-semibold ${pct >= 60 ? 'text-foreground' : 'text-destructive'}`}>
                          {pct}%
                        </td>
                        <td className="py-2 text-muted-foreground">{formatDate(t.testDate)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: color + '18' }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}
