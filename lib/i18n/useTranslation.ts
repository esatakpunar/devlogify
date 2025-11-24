'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { getDictionary, getNestedValue, type Dictionary } from './dictionary'

/**
 * Hook to use translations in client components
 * 
 * @example
 * const t = useTranslation()
 * <h1>{t('dashboard.title')}</h1>
 * <p>{t('dashboard.welcomeBack', { name: 'John' })}</p>
 */
export function useTranslation() {
  const { locale } = useLanguage()
  const dictionary = useMemo(() => getDictionary(locale), [locale])

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(dictionary, key, key)

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`\\{${paramKey}\\}`, 'g'),
          String(paramValue)
        )
      })
    }

    return translation
  }

  return t
}

/**
 * Hook to get the full dictionary (useful for complex cases)
 */
export function useDictionary(): Dictionary {
  const { locale } = useLanguage()
  return useMemo(() => getDictionary(locale), [locale])
}

