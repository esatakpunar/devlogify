#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DICT_DIR = path.join(ROOT, 'dictionaries')
const LOCALES = ['en', 'tr', 'de', 'es']
const SOURCE_DIRS = ['app', 'components', 'lib']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function flattenKeys(value, prefix = '', result = new Set()) {
  if (typeof value === 'string') {
    result.add(prefix)
    return result
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return result
  }

  for (const [key, nested] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    flattenKeys(nested, nextPrefix, result)
  }

  return result
}

function walkFiles(dirPath, out = []) {
  if (!fs.existsSync(dirPath)) return out

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const absolute = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      walkFiles(absolute, out)
      continue
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(absolute)
    }
  }

  return out
}

function extractTranslationKeys(fileContent) {
  const keys = new Set()
  const staticCallRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g
  let match
  while ((match = staticCallRegex.exec(fileContent)) !== null) {
    const key = match[1]?.trim()
    if (!key || key.includes('${')) continue
    keys.add(key)
  }
  return keys
}

const dictionaries = Object.fromEntries(
  LOCALES.map((locale) => [locale, readJson(path.join(DICT_DIR, `${locale}.json`))])
)

const baseLocale = 'en'
const baseKeys = flattenKeys(dictionaries[baseLocale])
const localeKeys = Object.fromEntries(
  LOCALES.map((locale) => [locale, flattenKeys(dictionaries[locale])])
)

const errors = []

for (const locale of LOCALES) {
  if (locale === baseLocale) continue

  const currentKeys = localeKeys[locale]
  const missing = [...baseKeys].filter((key) => !currentKeys.has(key))
  const extra = [...currentKeys].filter((key) => !baseKeys.has(key))

  if (missing.length > 0) {
    errors.push(
      `[${locale}] Missing keys (${missing.length}):\n${missing
        .slice(0, 30)
        .map((key) => `  - ${key}`)
        .join('\n')}${missing.length > 30 ? '\n  ...' : ''}`
    )
  }

  if (extra.length > 0) {
    errors.push(
      `[${locale}] Extra keys not in ${baseLocale} (${extra.length}):\n${extra
        .slice(0, 30)
        .map((key) => `  - ${key}`)
        .join('\n')}${extra.length > 30 ? '\n  ...' : ''}`
    )
  }
}

const sourceFiles = SOURCE_DIRS.flatMap((dir) => walkFiles(path.join(ROOT, dir)))
const usedKeys = new Set()

for (const filePath of sourceFiles) {
  const content = fs.readFileSync(filePath, 'utf8')
  const keys = extractTranslationKeys(content)
  for (const key of keys) usedKeys.add(key)
}

const missingFromBase = [...usedKeys].filter((key) => !baseKeys.has(key))
if (missingFromBase.length > 0) {
  errors.push(
    `Missing dictionary entries for used translation keys (${missingFromBase.length}):\n${missingFromBase
      .slice(0, 50)
      .map((key) => `  - ${key}`)
      .join('\n')}${missingFromBase.length > 50 ? '\n  ...' : ''}`
  )
}

if (errors.length > 0) {
  console.error('\n[i18n] Validation failed:\n')
  for (const error of errors) {
    console.error(`${error}\n`)
  }
  process.exit(1)
}

console.log('[i18n] Validation passed')
