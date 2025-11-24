export type Locale = 'tr' | 'en' | 'de' | 'es'

export const locales: Locale[] = ['tr', 'en', 'de', 'es']
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
}

/**
 * Get browser language and map to supported locale
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const browserLang = navigator.language || (navigator as any).userLanguage
  const langCode = browserLang.split('-')[0].toLowerCase()

  // Map browser language to supported locale
  if (langCode === 'tr') return 'tr'
  if (langCode === 'de') return 'de'
  if (langCode === 'es') return 'es'
  // Default to English for all other languages
  return 'en'
}

/**
 * Validate if locale is supported
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

