'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserProfileStore } from '@/lib/store/userProfileStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfileStore()

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // First, apply theme from localStorage immediately (for fast initial render)
        const savedTheme = localStorage.getItem('theme') || 'system'
        applyTheme(savedTheme as 'light' | 'dark' | 'system')

        // Then, try to get theme from store profile and sync
        if (profile && profile.theme) {
          // Database'deki theme'i kullan ve localStorage'ı senkronize et
          const dbTheme = profile.theme
          localStorage.setItem('theme', dbTheme)
          applyTheme(dbTheme)
        }
      } catch (error) {
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('theme') || 'system'
        applyTheme(savedTheme as 'light' | 'dark' | 'system')
      }
    }

    initializeTheme()

    // Listen for localStorage theme changes (when theme is updated in settings)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        applyTheme(e.newValue as 'light' | 'dark' | 'system')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event (for same-tab updates)
    const handleThemeChange = (e: CustomEvent) => {
      if (e.detail?.theme) {
        applyTheme(e.detail.theme)
      }
    }

    window.addEventListener('themechange', handleThemeChange as EventListener)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem('theme') || 'system'
      if (currentTheme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('themechange', handleThemeChange as EventListener)
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [profile])

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }

  return <>{children}</>
}