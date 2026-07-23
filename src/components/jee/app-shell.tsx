'use client'

import { useState, useTransition } from 'react'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Settings,
  Menu,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tab } from '@/lib/store'

const NAV: { href: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { href: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { href: 'schedule', label: 'Schedule', icon: CalendarClock },
  { href: 'tests', label: 'Tests', icon: ClipboardList },
  { href: 'settings', label: 'Settings', icon: Settings },
]

function initialsOf(name?: string | null, email?: string) {
  const base = name?.trim() || email || 'S'
  const parts = base.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'S').concat(parts[1]?.[0] ?? '').toUpperCase()
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = activeTab === item.href
        const Icon = item.icon
        return (
          <button
            key={item.href}
            onClick={() => {
              setActiveTab(item.href)
              onNavigate?.()
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-[18px]" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight">PrepTrack</p>
        <p className="text-xs text-muted-foreground">JEE Preparation</p>
      </div>
    </div>
  )
}

export function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        const token = localStorage.getItem('jee_token')
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      } catch {}
      logout()
    })
  }

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent">
          <Avatar className="size-9">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
              {initialsOf(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user?.name || 'Student'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => useAppStore.getState().setActiveTab('settings')}
        >
          <Settings className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          {isPending ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="mb-6 mt-1">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border pt-3">{userMenu}</div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="mb-6 mt-1">
              <Brand />
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-6 border-t border-sidebar-border pt-3">
              {userMenu}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}