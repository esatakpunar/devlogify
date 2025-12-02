'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/supabase/queries/profiles'
import { useUserProfileStore } from '@/lib/store/userProfileStore'
import type { Locale } from '@/lib/i18n/config'
import { getBrowserLocale, defaultLocale, isValidLocale } from '@/lib/i18n/config'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  loading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [loading, setLoading] = useState(true)
  const { profile } = useUserProfileStore()

  // Initialize locale from profile or browser
  useEffect(() => {
    const initializeLocale = async () => {
      try {
        // First, try to get from localStorage (for instant UI update)
        const savedLocale = localStorage.getItem('locale')
        if (savedLocale && isValidLocale(savedLocale)) {
          setLocaleState(savedLocale)
          setLoading(false)
        }

        // Then, try to get from store profile if user is logged in
        if (userId && profile && profile.id === userId) {
          if (profile.language && isValidLocale(profile.language)) {
            const dbLocale = profile.language
            setLocaleState(dbLocale)
            localStorage.setItem('locale', dbLocale)
          } else {
            // No language in profile, use browser language
            const browserLocale = getBrowserLocale()
            setLocaleState(browserLocale)
            localStorage.setItem('locale', browserLocale)
            
            // Save browser locale to profile
            await updateProfile(userId, { language: browserLocale })
          }
        } else if (userId) {
          // User is logged in but profile not loaded yet, wait a bit
          // This will be handled when profile loads in DashboardLayout
          const browserLocale = getBrowserLocale()
          setLocaleState(browserLocale)
          localStorage.setItem('locale', browserLocale)
        } else {
          // Not logged in, use browser locale
          const browserLocale = getBrowserLocale()
          setLocaleState(browserLocale)
          localStorage.setItem('locale', browserLocale)
        }
      } catch (error) {
        console.error('Failed to initialize locale:', error)
        // Fallback to default
        setLocaleState(defaultLocale)
        localStorage.setItem('locale', defaultLocale)
      } finally {
        setLoading(false)
      }
    }

    initializeLocale()
  }, [userId, profile])

  // Update locale (both state and database)
  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!isValidLocale(newLocale)) {
      console.error('Invalid locale:', newLocale)
      return
    }

    // Update state immediately (no page refresh needed)
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)

    // Update database if user is logged in
    if (userId) {
      try {
        await updateProfile(userId, { language: newLocale })
      } catch (error) {
        console.error('Failed to update language in database:', error)
        // Still keep the locale change in localStorage
      }
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale: newLocale } }))
  }, [userId])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, loading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

