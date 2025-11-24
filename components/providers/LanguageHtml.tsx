'use client'

import { useEffect } from 'react'
import { useLanguage } from './LanguageProvider'

/**
 * Client component to update html lang attribute dynamically
 * This must be used inside LanguageProvider
 */
export function LanguageHtml() {
  const { locale } = useLanguage()

  useEffect(() => {
    // Update html lang attribute
    document.documentElement.lang = locale
  }, [locale])

  return null
}

