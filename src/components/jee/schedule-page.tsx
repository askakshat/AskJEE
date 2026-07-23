'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Trash2, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { SUBJECTS, SUBJECT_META, type Subject } from '@/lib/constants'
import type { Schedule } from '@/lib/types'
import { formatDate, formatTime, todayISO, relativeDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'

function getToken() {
  return localStorage.getItem('jee_token')
}

function headers() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchSchedules = useCallback(() => {
    const token = getToken()
    fetch('/api/schedules', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setSchedules(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const grouped = useMemo(() => {
    const map = new Map<string, Schedule[]>()
    for (const s of schedules) {
      const arr = map.get(s.scheduledDate) ?? []
      arr.push(s)
      map.set(s.scheduledDate, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [schedules])

  const toggleDone = async (id: string, current: boolean) => {
    const prev = [...schedules]
    setSchedules((ss) => ss.map((s) => (s.id === id ? { ...s, isDone: !current } : s)))
    try {
      const res = await fetch('/api/schedules', { method: 'PATCH', headers: headers(), body: JSON.stringify({ id, isDone: !current }) })
      if (!res.ok) throw new Error()
    } catch {
      setSchedules(prev)
      toast.error('Could not update')
    }
  }

  const deleteItem = async (id: string) => {
    setSchedules((ss) => ss.filter((s) => s.id !== id))
    try {
      await fetch(`/api/schedules?id=${id}`, { method: 'DELETE', headers: headers() })
      toast.success('Deleted')
    } catch {
      toast.error('Could not delete')
    }
  }

  const onCreated = () => {
    setDialogOpen(false)
    fetchSchedules()
    toast.success('Schedule added')
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Plan your study sessions and track daily tasks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Study Task</DialogTitle>
              <DialogDescription>Schedule a study session or task</DialogDescription>
            </DialogHeader>
            <AddScheduleForm onCreated={onCreated} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="mb-3 size-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No tasks yet</p>
            <p className="text-sm text-muted-foreground/70">Click &quot;Add Task&quot; to plan your study schedule</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => {
            const isToday = date === todayISO()
            const done = items.filter((i) => i.isDone).length
            return (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    {isToday ? 'Today' : formatDate(date)}
                  </h2>
                  {!isToday && relativeDay(date) && (
                    <span className="text-xs text-muted-foreground">{relativeDay(date)}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{done}/{items.length} done</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <Card key={item.id} className={cn('transition-opacity', item.isDone && 'opacity-60')}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <Checkbox
                          checked={item.isDone}
                          onCheckedChange={() => toggleDone(item.id, item.isDone)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={cn('font-medium text-sm', item.isDone && 'line-through')}>{item.title}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {item.subject && (
                              <span className="flex items-center gap-1">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: SUBJECT_META[item.subject as Subject]?.token }}
                                />
                                {item.subject}
                              </span>
                            )}
                            {item.startTime && (
                              <span>{formatTime(item.startTime)}{item.endTime ? ` - ${formatTime(item.endTime)}` : ''}</span>
                            )}
                            {item.notes && <span>{item.notes}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddScheduleForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<string>('General')
  const [date, setDate] = useState(todayISO())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          title: title.trim(),
          subject: subject === 'General' ? null : subject,
          scheduledDate: date,
          startTime: startTime || null,
          endTime: endTime || null,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      onCreated()
    } catch {
      toast.error('Could not add task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sched-title">Title *</Label>
        <Input id="sched-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solve NCERT Mechanics" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sched-date">Date *</Label>
          <Input id="sched-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sched-start">Start Time</Label>
          <Input id="sched-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sched-end">End Time</Label>
          <Input id="sched-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sched-notes">Notes</Label>
        <Textarea id="sched-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Add Task
        </Button>
      </DialogFooter>
    </form>
  )
}
