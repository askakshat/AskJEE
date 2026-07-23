'use client'

import { create } from 'zustand'
import type { UserProfile } from './types'

type Tab = 'dashboard' | 'syllabus' | 'schedule' | 'tests' | 'settings'

interface AppState {
  // Auth
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  setUser: (user: UserProfile | null, token: string | null) => void
  logout: () => void
  setLoading: (v: boolean) => void

  // Navigation
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('jee_token') : null,
  isLoading: true,
  setUser: (user, token) => {
    if (token) localStorage.setItem('jee_token', token)
    else localStorage.removeItem('jee_token')
    set({ user, token, isLoading: false })
  },
  logout: () => {
    localStorage.removeItem('jee_token')
    set({ user: null, token: null })
  },
  setLoading: (v) => set({ isLoading: v }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
