import type { Locale } from './config'

// Keep a lightweight in-bundle fallback dictionary and lazy-load others.
import en from '@/dictionaries/en.json'

export type Dictionary = typeof en

type DictionaryLoader = () => Promise<Dictionary>

const dictionaryLoaders: Record<Locale, DictionaryLoader> = {
  en: async () => en,
  tr: async () => (await import('@/dictionaries/tr.json')).default as Dictionary,
  de: async () => (await import('@/dictionaries/de.json')).default as Dictionary,
  es: async () => (await import('@/dictionaries/es.json')).default as Dictionary,
}

/**
 * In-memory dictionary cache to avoid duplicate dynamic imports.
 */
const dictionaryCache: Partial<Record<Locale, Dictionary>> = {
  en,
}

const dictionaryPromises: Partial<Record<Locale, Promise<Dictionary>>> = {}

export function getFallbackDictionary(): Dictionary {
  return en
}

/**
 * Get dictionary for a specific locale.
 * Uses dynamic import for non-default locales to reduce initial bundle size.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const cached = dictionaryCache[locale]
  if (cached) return cached

  if (!dictionaryPromises[locale]) {
    const loader = dictionaryLoaders[locale]
    if (!loader) {
      throw new Error(`Dictionary not found for locale: ${locale}`)
    }

    dictionaryPromises[locale] = loader().then((dict) => {
      dictionaryCache[locale] = dict
      return dict
    })
  }

  return dictionaryPromises[locale] as Promise<Dictionary>
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
