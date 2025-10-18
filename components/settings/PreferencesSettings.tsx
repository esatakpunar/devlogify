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
import { Moon, Sun, Monitor } from 'lucide-react'
import { toast } from 'sonner'

interface PreferencesSettingsProps {
  userId: string
}

export function PreferencesSettings({ userId }: PreferencesSettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [notifications, setNotifications] = useState(true)
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
    const savedNotifications = localStorage.getItem('notifications') !== 'false'
    const savedWeekStart = localStorage.getItem('weekStartsOn') as 'monday' | 'sunday' || 'monday'

    setTheme(savedTheme)
    setNotifications(savedNotifications)
    setWeekStartsOn(savedWeekStart)

    applyTheme(savedTheme)
  }, [])

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

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    toast.success('Theme updated')
  }

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked)
    localStorage.setItem('notifications', checked.toString())
    toast.success(checked ? 'Notifications enabled' : 'Notifications disabled')
  }

  const handleWeekStartChange = (value: 'monday' | 'sunday') => {
    setWeekStartsOn(value)
    localStorage.setItem('weekStartsOn', value)
    toast.success('Week start day updated')
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
        <Select value={theme} onValueChange={handleThemeChange}>
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
        <Select value={weekStartsOn} onValueChange={handleWeekStartChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monday">Monday</SelectItem>
            <SelectItem value="sunday">Sunday</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}