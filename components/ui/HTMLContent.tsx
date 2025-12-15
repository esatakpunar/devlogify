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
  // Strip HTML tags for plain text preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // If maxLines is specified, show plain text preview
  if (maxLines) {
    const plainText = stripHtml(content)
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
  if (typeof window === 'undefined') {
    // Server-side: simple regex strip
    return html.replace(/<[^>]*>/g, '').trim()
  }
  
  // Client-side: proper DOM parsing
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
