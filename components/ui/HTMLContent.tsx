'use client'

import { cn } from '@/lib/utils'

interface HTMLContentProps {
  content: string
  className?: string
  maxLines?: number
}

/**
 * Safely renders HTML content from rich text editor (Quill)
 * Strips HTML tags for preview or renders full HTML
 */
export function HTMLContent({ content, className, maxLines }: HTMLContentProps) {
  // If maxLines is specified, show plain text preview
  if (maxLines) {
    const plainText = getPlainTextFromHTML(content)
    return (
      <p className={cn('whitespace-pre-wrap break-words', `line-clamp-${maxLines}`, className)}>
        {plainText}
      </p>
    )
  }

  // Otherwise render full HTML
  return (
    <div 
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

/**
 * Safe plain text extraction from HTML content
 */
export function getPlainTextFromHTML(html: string): string {
  const withoutTags = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')

  return decodeHtmlEntities(withoutTags)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(input: string): string {
  const namedEntities: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
  }

  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x'
      const value = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)
      if (Number.isFinite(value)) {
        return String.fromCodePoint(value)
      }
      return match
    }

    return namedEntities[entity] ?? match
  })
}
