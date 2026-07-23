'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { SUBJECTS, SUBJECT_META, TEST_TYPES, type TestType, type Subject } from '@/lib/constants'
import type { TestWithSections } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

function getToken() {
  return localStorage.getItem('jee_token')
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

interface SectionForm {
  subject: Subject
  correct: string
  incorrect: string
  unattempted: string
  marks: string
  maxMarks: string
}

export function TestsPage() {
  const [tests, setTests] = useState<TestWithSections[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchTests = useCallback(() => {
    const token = getToken()
    fetch('/api/tests', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setTests(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTests() }, [fetchTests])

  const deleteTest = async (id: string) => {
    setTests((ts) => ts.filter((t) => t.id !== id))
    try {
      await fetch(`/api/tests?id=${id}`, { method: 'DELETE', headers: authHeaders() })
      toast.success('Test deleted')
    } catch {
      toast.error('Could not delete')
    }
  }

  const scoreTrend = useMemo(() => {
    return [...tests]
      .sort((a, b) => a.testDate.localeCompare(b.testDate))
      .map((t) => ({
        date: t.testDate,
        pct: Math.round((t.obtainedMarks / t.totalMarks) * 100),
        marks: t.obtainedMarks,
      }))
  }, [tests])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Tests</h1>
          <p className="text-sm text-muted-foreground">
            Track your test scores with subject-wise breakdowns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" /> Add Test</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Test Score</DialogTitle>
              <DialogDescription>Add a new test with optional section breakdowns</DialogDescription>
            </DialogHeader>
            <AddTestForm
              onCreated={() => {
                setDialogOpen(false)
                fetchTests()
                toast.success('Test recorded')
              }}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </header>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-3 size-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No tests recorded</p>
            <p className="text-sm text-muted-foreground/70">Click &quot;Add Test&quot; to start tracking scores</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score trend bar chart */}
          {scoreTrend.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <h2 className="text-base font-semibold">Score Trend</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1" style={{ height: 120 }}>
                  {scoreTrend.map((s, i) => {
                    const maxH = 100
                    const h = Math.max(4, (s.pct / 100) * maxH)
                    const color = s.pct >= 60 ? 'var(--status-completed)' : s.pct >= 40 ? 'var(--status-revision)' : 'var(--status-backlog)'
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold tabular-nums">{s.pct}%</span>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{ height: h, backgroundColor: color, minHeight: 4 }}
                          title={`${s.marks} marks (${s.pct}%)`}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test list */}
          <div className="space-y-2">
            {tests.map((test) => {
              const pct = Math.round((test.obtainedMarks / test.totalMarks) * 100)
              const isOpen = expanded === test.id
              return (
                <Collapsible key={test.id} open={isOpen} onOpenChange={(o) => setExpanded(o ? test.id : null)}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center gap-3 p-4 text-left">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{test.name}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {test.testType}
                            </span>
                            {test.rank && <span className="text-xs text-muted-foreground">Rank #{test.rank}</span>}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-semibold tabular-nums">{test.obtainedMarks}/{test.totalMarks}</span>
                            <span className="text-xs">{formatDate(test.testDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={cn(
                              'text-lg font-bold tabular-nums',
                              pct >= 60 ? 'text-foreground' : 'text-destructive',
                            )}>
                              {pct}%
                            </span>
                          </div>
                          {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {test.sections.length > 0 && (
                        <div className="border-t px-4 py-3">
                          <p className="mb-2 text-xs font-semibold text-muted-foreground">Section Breakdown</p>
                          <div className="space-y-2">
                            {test.sections.map((sec) => {
                              const sPct = sec.maxMarks > 0 ? Math.round((sec.marks / sec.maxMarks) * 100) : 0
                              return (
                                <div key={sec.id} className="flex items-center gap-3 text-sm">
                                  <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: SUBJECT_META[sec.subject]?.token }}
                                  />
                                  <span className="w-24 font-medium">{sec.subject}</span>
                                  <Progress value={sPct} className="h-2 flex-1" />
                                  <span className="w-16 text-right tabular-nums font-medium">{sec.marks}/{sec.maxMarks}</span>
                                  <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">
                                    {sec.correct}✓ {sec.incorrect}✗ {sec.unattempted}—
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      <div className="border-t px-4 py-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteTest(test.id) }}
                        >
                          <Trash2 className="mr-1.5 size-3.5" /> Delete
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function AddTestForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [testType, setTestType] = useState<TestType>('Mock')
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10))
  const [totalMarks, setTotalMarks] = useState('300')
  const [obtainedMarks, setObtainedMarks] = useState('')
  const [rank, setRank] = useState('')
  const [percentile, setPercentile] = useState('')
  const [notes, setNotes] = useState('')
  const [sections, setSections] = useState<SectionForm[]>([
    { subject: 'Physics', correct: '', incorrect: '', unattempted: '', marks: '', maxMarks: '100' },
    { subject: 'Chemistry', correct: '', incorrect: '', unattempted: '', marks: '', maxMarks: '100' },
    { subject: 'Mathematics', correct: '', incorrect: '', unattempted: '', marks: '', maxMarks: '100' },
  ])
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !obtainedMarks) return
    setSaving(true)
    try {
      const parsedSections = sections
        .filter((s) => s.marks || s.correct)
        .map((s) => ({
          subject: s.subject,
          correct: Number(s.correct) || 0,
          incorrect: Number(s.incorrect) || 0,
          unattempted: Number(s.unattempted) || 0,
          marks: Number(s.marks) || 0,
          maxMarks: Number(s.maxMarks) || 0,
        }))

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          testType,
          testDate,
          totalMarks: Number(totalMarks) || 300,
          obtainedMarks: Number(obtainedMarks),
          rank: rank ? Number(rank) : null,
          percentile: percentile ? Number(percentile) : null,
          notes: notes.trim() || null,
          sections: parsedSections,
        }),
      })
      if (!res.ok) throw new Error()
      onCreated()
    } catch {
      toast.error('Could not save test')
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (idx: number, key: keyof SectionForm, val: string) => {
    setSections((ss) => ss.map((s, i) => (i === idx ? { ...s, [key]: val } : s)))
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="test-name">Test Name *</Label>
          <Input id="test-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. JEE Main Mock #5" required />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={testType} onValueChange={(v) => setTestType(v as TestType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEST_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-date">Date *</Label>
          <Input id="test-date" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-total">Total Marks</Label>
          <Input id="test-total" type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-obtained">Obtained Marks *</Label>
          <Input id="test-obtained" type="number" value={obtainedMarks} onChange={(e) => setObtainedMarks(e.target.value)} placeholder="e.g. 210" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-rank">Rank (optional)</Label>
          <Input id="test-rank" type="number" value={rank} onChange={(e) => setRank(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-pct">Percentile (optional)</Label>
          <Input id="test-pct" type="number" step="0.1" value={percentile} onChange={(e) => setPercentile(e.target.value)} />
        </div>
      </div>

      {/* Section breakdowns */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Section Breakdown (optional)</Label>
        {sections.map((sec, idx) => (
          <div key={sec.subject} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: SUBJECT_META[sec.subject].token }} />
              <span className="text-sm font-medium">{sec.subject}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Correct</Label>
                <Input type="number" className="h-8 text-sm" value={sec.correct} onChange={(e) => updateSection(idx, 'correct', e.target.value)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Incorrect</Label>
                <Input type="number" className="h-8 text-sm" value={sec.incorrect} onChange={(e) => updateSection(idx, 'incorrect', e.target.value)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Unattempted</Label>
                <Input type="number" className="h-8 text-sm" value={sec.unattempted} onChange={(e) => updateSection(idx, 'unattempted', e.target.value)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Marks</Label>
                <Input type="number" className="h-8 text-sm" value={sec.marks} onChange={(e) => updateSection(idx, 'marks', e.target.value)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Max</Label>
                <Input type="number" className="h-8 text-sm" value={sec.maxMarks} onChange={(e) => updateSection(idx, 'maxMarks', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-notes">Notes</Label>
        <Textarea id="test-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Topics to focus on, mistakes to avoid..." rows={2} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !name.trim() || !obtainedMarks}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Test
        </Button>
      </DialogFooter>
    </form>
  )
}
