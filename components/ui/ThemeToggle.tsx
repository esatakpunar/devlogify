'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getProfile, updateProfile, createProfile } from '@/lib/supabase/queries/profiles'

interface ThemeToggleProps {
  userId?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'icon'
}

export function ThemeToggle({ userId, variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get current theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    // Convert 'system' to 'light' or 'dark' based on system preference
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
      applyTheme(systemTheme)
    } else {
      setTheme(savedTheme as 'light' | 'dark')
      applyTheme(savedTheme as 'light' | 'dark')
    }
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
  }

  const handleToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Dispatch custom event to notify ThemeProvider
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }))

    // Update in database if userId is provided
    if (userId) {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          try {
            const profile = await getProfile(user.id)
            if (profile) {
              await updateProfile(user.id, { theme: newTheme })
            } else {
              await createProfile(user.id, user.email || '', '', { theme: newTheme })
            }
          } catch (error) {
            console.error('Failed to update theme in database:', error)
          }
        }
      } catch (error) {
        console.error('Failed to update theme:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      disabled={loading}
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}

