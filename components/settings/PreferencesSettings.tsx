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
import { Moon, Sun, Monitor, Globe, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile, createProfile, Profile } from '@/lib/supabase/queries/profiles'
import { useUserProfileStore } from '@/lib/store/userProfileStore'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { localeNames, localeFlags, type Locale } from '@/lib/i18n/config'

interface PreferencesSettingsProps {
  userId: string
}

export function PreferencesSettings({ userId }: PreferencesSettingsProps) {
  const { locale, setLocale } = useLanguage()
  const t = useTranslation()
  const { profile: storeProfile, fetchProfile } = useUserProfileStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [notifications, setNotifications] = useState(true)
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday')
  const [timezone, setTimezone] = useState('Europe/Istanbul')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      // First try to get from store
      if (storeProfile && storeProfile.id === userId) {
        setProfile(storeProfile)
        setTheme(storeProfile.theme)
        setNotifications(storeProfile.notifications_enabled)
        setWeekStartsOn(storeProfile.week_starts_on)
        setTimezone(storeProfile.timezone)
        applyTheme(storeProfile.theme)
        setInitialLoading(false)
        return
      }

      // If not in store, fetch it (shouldn't happen if DashboardLayout loaded properly)
      try {
        await fetchProfile(userId)
        // Wait a bit for store to update, then check again
        setTimeout(() => {
          const updatedProfile = useUserProfileStore.getState().profile
          if (updatedProfile && updatedProfile.id === userId) {
            setProfile(updatedProfile)
            setTheme(updatedProfile.theme)
            setNotifications(updatedProfile.notifications_enabled)
            setWeekStartsOn(updatedProfile.week_starts_on)
            setTimezone(updatedProfile.timezone)
            applyTheme(updatedProfile.theme)
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
          setInitialLoading(false)
        }, 100)
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
        setInitialLoading(false)
      }
    }

    loadProfile()
  }, [userId, storeProfile, fetchProfile])

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
      let updatedProfile: Profile
      if (profile) {
        updatedProfile = await updateProfile(userId, updates)
      } else {
        updatedProfile = await createProfile(userId, '', '', updates)
      }
      setProfile(updatedProfile)
      // Update store
      useUserProfileStore.getState().setProfile(updatedProfile)
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
      
      // Dispatch custom event to notify ThemeProvider (for same-tab updates)
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }))
      
      toast.success(t('settings.themeUpdated'))
    } catch (error) {
      toast.error(t('settings.updateFailed'))
    }
  }

  const handleLanguageChange = async (value: string) => {
    const newLocale = value as Locale
    try {
      await setLocale(newLocale)
      await updateProfileSetting({ language: newLocale })
      toast.success(t('settings.languageUpdated'))
    } catch (error) {
      toast.error(t('settings.updateFailed'))
    }
  }

  const handleNotificationsChange = async (checked: boolean) => {
    setNotifications(checked)
    
    try {
      await updateProfileSetting({ notifications_enabled: checked })
      // Also update localStorage for backward compatibility
      localStorage.setItem('notifications', checked.toString())
      toast.success(checked ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled'))
    } catch (error) {
      toast.error(t('settings.updateFailed'))
    }
  }

  const handleWeekStartChange = async (value: 'monday' | 'sunday') => {
    setWeekStartsOn(value)
    
    try {
      await updateProfileSetting({ week_starts_on: value })
      // Also update localStorage for backward compatibility
      localStorage.setItem('weekStartsOn', value)
      toast.success(t('settings.weekStartUpdated'))
    } catch (error) {
      toast.error(t('settings.updateFailed'))
    }
  }

  const handleTimezoneChange = async (value: string) => {
    setTimezone(value)
    
    try {
      await updateProfileSetting({ timezone: value })
      toast.success(t('settings.timezoneUpdated'))
    } catch (error) {
      toast.error(t('settings.updateFailed'))
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
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
      {/* Language */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.language')}</Label>
          <p className="text-sm text-gray-600">
            {t('settings.languageDescription')}
          </p>
        </div>
        <Select value={locale} onValueChange={handleLanguageChange} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['tr', 'en', 'de', 'es'] as Locale[]).map((loc) => (
              <SelectItem key={loc} value={loc}>
                <div className="flex items-center gap-2">
                  <span>{localeFlags[loc]}</span>
                  {localeNames[loc]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.theme')}</Label>
          <p className="text-sm text-gray-600">
            {t('settings.themeDescription')}
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
                {t('settings.light')}
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                {t('settings.dark')}
              </div>
            </SelectItem>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                {t('settings.system')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.notifications')}</Label>
          <p className="text-sm text-gray-600">
            {t('settings.notificationsDescription')}
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
          <Label>{t('settings.weekStartsOn')}</Label>
          <p className="text-sm text-gray-600">
            {t('settings.weekStartsOnDescription')}
          </p>
        </div>
        <Select value={weekStartsOn} onValueChange={handleWeekStartChange} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monday">{t('settings.monday')}</SelectItem>
            <SelectItem value="sunday">{t('settings.sunday')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t('settings.timezone')}</Label>
          <p className="text-sm text-gray-600">
            {t('settings.timezoneDescription')}
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