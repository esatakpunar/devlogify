/**
 * Markdown utilities for note processing
 */

import { marked } from 'marked'

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
})

/**
 * Convert markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }
  
  try {
    return marked.parse(markdown) as string
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return markdown.replace(/\n/g, '<br>')
  }
}

/**
 * Extract links from markdown (for note linking)
 */
export function extractLinks(markdown: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  
  while ((match = linkRegex.exec(markdown)) !== null) {
    links.push(match[1])
  }
  
  return links
}

/**
 * Convert wiki-style links to markdown links
 */
export function convertWikiLinks(markdown: string, noteTitles: Map<string, string>): string {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    // Find note by title
    for (const [id, title] of noteTitles.entries()) {
      if (title.toLowerCase() === linkText.toLowerCase()) {
        return `[${linkText}](/notes?highlight=${id})`
      }
    }
    // If not found, return as plain text
    return linkText
  })
}

/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: Array<{ language: string; code: string }> = []
  let match
  
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2],
    })
  }
  
  return blocks
}

