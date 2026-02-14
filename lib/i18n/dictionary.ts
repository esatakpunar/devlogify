import type { Locale } from './config'

// Import all dictionaries
// Note: Turbopack HMR warnings for JSON imports are harmless and can be ignored
import en from '@/dictionaries/en.json'
import tr from '@/dictionaries/tr.json'
import de from '@/dictionaries/de.json'
import es from '@/dictionaries/es.json'

export type Dictionary = typeof en

const dictionaries: Record<Locale, Dictionary> = {
  en,
  tr,
  de,
  es,
}

/**
 * Get dictionary for a specific locale
 */
export function getDictionary(locale: Locale): Dictionary {
  const dictionary = dictionaries[locale]
  if (!dictionary) {
    throw new Error(`Dictionary not found for locale: ${locale}`)
  }
  return dictionary
}

/**
 * Get nested value from dictionary using dot notation
 * Example: getNestedValue(dict, 'settings.theme')
 */
export function getNestedValue(
  obj: any,
  path: string
): string | undefined {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    value = value[key]
  }

  if (typeof value === 'string') {
    return value
  }

  return undefined
}
