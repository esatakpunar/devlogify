'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  const { profile, isLoading: profileLoading } = useUserProfileStore()

  useEffect(() => {
    const initializeLocale = async () => {
      try {
        if (userId) {
          if (profileLoading) {
            const savedLocale = localStorage.getItem('locale')
            if (savedLocale && isValidLocale(savedLocale)) {
              setLocaleState(savedLocale as Locale)
            } else {
              const browserLocale = getBrowserLocale()
              setLocaleState(browserLocale)
            }
            return
          }

          if (profile && profile.id === userId) {
            if (profile.language && isValidLocale(profile.language)) {
              const dbLocale = profile.language
              setLocaleState(dbLocale)
              localStorage.setItem('locale', dbLocale)
              setLoading(false)
              return
            }
            
            const browserLocale = getBrowserLocale()
            setLocaleState(browserLocale)
            localStorage.setItem('locale', browserLocale)
            await updateProfile(userId, { language: browserLocale })
            setLoading(false)
            return
          }

          const savedLocale = localStorage.getItem('locale')
          if (savedLocale && isValidLocale(savedLocale)) {
            setLocaleState(savedLocale as Locale)
          } else {
            const browserLocale = getBrowserLocale()
            setLocaleState(browserLocale)
            localStorage.setItem('locale', browserLocale)
          }
          setLoading(false)
        } else {
          const savedLocale = localStorage.getItem('locale')
          if (savedLocale && isValidLocale(savedLocale)) {
            setLocaleState(savedLocale as Locale)
          } else {
            const browserLocale = getBrowserLocale()
            setLocaleState(browserLocale)
            localStorage.setItem('locale', browserLocale)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to initialize locale:', error)
        setLocaleState(defaultLocale)
        localStorage.setItem('locale', defaultLocale)
        setLoading(false)
      }
    }

    initializeLocale()
  }, [userId, profile, profileLoading])

  const setLocale = useCallback(async (newLocale: Locale) => {
    if (!isValidLocale(newLocale)) {
      console.error('Invalid locale:', newLocale)
      return
    }

    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)

    if (userId) {
      try {
        await updateProfile(userId, { language: newLocale })
      } catch (error) {
        console.error('Failed to update language in database:', error)
      }
    }

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
    // Return default values instead of throwing during SSR or before provider is ready
    console.warn('useLanguage called outside of LanguageProvider, using defaults')
    return {
      locale: defaultLocale,
      setLocale: async () => {},
      loading: false
    }
  }
  return context
}

