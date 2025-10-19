'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Moon, Sun, Monitor, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { getProfile, updateProfile, createProfile, Profile } from '@/lib/supabase/queries/profiles'

interface PreferencesSettingsProps {
  userId: string
}

export function PreferencesSettings({ userId }: PreferencesSettingsProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [notifications, setNotifications] = useState(true)
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday')
  const [timezone, setTimezone] = useState('Europe/Istanbul')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getProfile(userId)
        if (userProfile) {
          setProfile(userProfile)
          setTheme(userProfile.theme)
          setNotifications(userProfile.notifications_enabled)
          setWeekStartsOn(userProfile.week_starts_on)
          setTimezone(userProfile.timezone)
          
          // Apply theme immediately
          applyTheme(userProfile.theme)
        } else {
          // Fallback to localStorage for existing users
          const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
          const savedNotifications = localStorage.getItem('notifications') !== 'false'
          const savedWeekStart = localStorage.getItem('weekStartsOn') as 'monday' | 'sunday' || 'monday'
          
          setTheme(savedTheme)
          setNotifications(savedNotifications)
          setWeekStartsOn(savedWeekStart)
          applyTheme(savedTheme)
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
        const savedNotifications = localStorage.getItem('notifications') !== 'false'
        const savedWeekStart = localStorage.getItem('weekStartsOn') as 'monday' | 'sunday' || 'monday'
        
        setTheme(savedTheme)
        setNotifications(savedNotifications)
        setWeekStartsOn(savedWeekStart)
        applyTheme(savedTheme)
      } finally {
        setInitialLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  const updateProfileSetting = async (updates: Partial<Profile>) => {
    setLoading(true)
    try {
      if (profile) {
        const updatedProfile = await updateProfile(userId, updates)
        setProfile(updatedProfile)
      } else {
        const newProfile = await createProfile(userId, '', '', updates)
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    applyTheme(newTheme)
    
    try {
      await updateProfileSetting({ theme: newTheme })
      // Also update localStorage for backward compatibility
      localStorage.setItem('theme', newTheme)
      toast.success('Theme updated')
    } catch (error) {
      toast.error('Failed to update theme')
    }
  }

  const handleNotificationsChange = async (checked: boolean) => {
    setNotifications(checked)
    
    try {
      await updateProfileSetting({ notifications_enabled: checked })
      // Also update localStorage for backward compatibility
      localStorage.setItem('notifications', checked.toString())
      toast.success(checked ? 'Notifications enabled' : 'Notifications disabled')
    } catch (error) {
      toast.error('Failed to update notifications')
    }
  }

  const handleWeekStartChange = async (value: 'monday' | 'sunday') => {
    setWeekStartsOn(value)
    
    try {
      await updateProfileSetting({ week_starts_on: value })
      // Also update localStorage for backward compatibility
      localStorage.setItem('weekStartsOn', value)
      toast.success('Week start day updated')
    } catch (error) {
      toast.error('Failed to update week start day')
    }
  }

  const handleTimezoneChange = async (value: string) => {
    setTimezone(value)
    
    try {
      await updateProfileSetting({ timezone: value })
      toast.success('Timezone updated')
    } catch (error) {
      toast.error('Failed to update timezone')
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
            </div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-[180px]" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Theme</Label>
          <p className="text-sm text-gray-600">
            Choose your preferred theme
          </p>
        </div>
        <Select value={theme} onValueChange={handleThemeChange} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Dark
              </div>
            </SelectItem>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                System
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Notifications</Label>
          <p className="text-sm text-gray-600">
            Receive notifications about your tasks
          </p>
        </div>
        <Switch
          checked={notifications}
          onCheckedChange={handleNotificationsChange}
          disabled={loading}
        />
      </div>

      {/* Week Starts On */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Week starts on</Label>
          <p className="text-sm text-gray-600">
            Choose the first day of your week
          </p>
        </div>
        <Select value={weekStartsOn} onValueChange={handleWeekStartChange} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monday">Monday</SelectItem>
            <SelectItem value="sunday">Sunday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Timezone</Label>
          <p className="text-sm text-gray-600">
            Your local timezone for accurate time tracking
          </p>
        </div>
        <Select value={timezone} onValueChange={handleTimezoneChange} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Europe/Istanbul">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Europe/Istanbul
              </div>
            </SelectItem>
            <SelectItem value="UTC">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                UTC
              </div>
            </SelectItem>
            <SelectItem value="America/New_York">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                America/New_York
              </div>
            </SelectItem>
            <SelectItem value="America/Los_Angeles">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                America/Los_Angeles
              </div>
            </SelectItem>
            <SelectItem value="Europe/London">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Europe/London
              </div>
            </SelectItem>
            <SelectItem value="Asia/Tokyo">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Asia/Tokyo
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}