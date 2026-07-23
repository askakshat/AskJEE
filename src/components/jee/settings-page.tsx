'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

function getToken() {
  return localStorage.getItem('jee_token')
}

export function SettingsPage() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)

  const [name, setName] = useState('')
  const [targetYear, setTargetYear] = useState('')
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setTargetYear(user.targetYear?.toString() || '')
      setRemindersEnabled(user.remindersEnabled)
      setLoading(false)
    }
  }, [user])

  async function save() {
    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim() || null,
          targetYear: targetYear ? Number(targetYear) : null,
          remindersEnabled,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUser(data, useAppStore.getState().token)
      toast.success('Settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2]

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information and JEE target</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-email">Email</Label>
            <Input id="set-email" value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="set-name">Name</Label>
            <Input
              id="set-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label>Target JEE Year</Label>
            <div className="flex gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setTargetYear(y.toString())}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    targetYear === y.toString()
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Revision Reminders</p>
              <p className="text-xs text-muted-foreground">
                Show notifications for chapters due for revision
              </p>
            </div>
            <Switch
              checked={remindersEnabled}
              onCheckedChange={setRemindersEnabled}
            />
          </div>

          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data (chapters progress, schedules, test scores). This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            className="mt-3"
            onClick={async () => {
              if (!confirm('Are you sure? This will delete your account and all data.')) return
              try {
                const token = getToken()
                await fetch('/api/auth/me', {
                  method: 'DELETE',
                  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                })
                localStorage.removeItem('jee_token')
                localStorage.removeItem('jee_user')
                setUser(null, null)
                toast.success('Account deleted')
              } catch {
                toast.error('Could not delete account')
              }
            }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
