'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AuthForm } from '@/components/jee/auth-form'
import { AppShell } from '@/components/jee/app-shell'
import { DashboardPage } from '@/components/jee/dashboard-page'
import { SyllabusPage } from '@/components/jee/syllabus-page'
import { SchedulePage } from '@/components/jee/schedule-page'
import { TestsPage } from '@/components/jee/tests-page'
import { SettingsPage } from '@/components/jee/settings-page'
import type { UserProfile } from '@/lib/types'

export default function Home() {
  const user = useAppStore((s) => s.user)
  const token = useAppStore((s) => s.token)
  const isLoading = useAppStore((s) => s.isLoading)
  const setUser = useAppStore((s) => s.setUser)
  const setLoading = useAppStore((s) => s.setLoading)
  const activeTab = useAppStore((s) => s.activeTab)

  // Check session on mount
  useEffect(() => {
    const t = localStorage.getItem('jee_token')
    if (!t) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((u: UserProfile) => {
        setUser(u, t)
      })
      .catch(() => {
        localStorage.removeItem('jee_token')
        setLoading(false)
      })
  }, [])

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated → show auth form
  if (!user || !token) {
    return <AuthForm />
  }

  // Authenticated → show app shell with tab content
  const tabContent = {
    dashboard: <DashboardPage />,
    syllabus: <SyllabusPage />,
    schedule: <SchedulePage />,
    tests: <TestsPage />,
    settings: <SettingsPage />,
  }

  return <AppShell>{tabContent[activeTab]}</AppShell>
}
