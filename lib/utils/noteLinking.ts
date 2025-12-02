/**
 * Note linking utilities
 * Supports wiki-style linking: [[Note Title]]
 */

/**
 * Extract note links from markdown content
 * Returns array of note titles found in [[Note Title]] format
 */
export function extractNoteLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    const noteTitle = match[1].trim()
    if (noteTitle && !links.includes(noteTitle)) {
      links.push(noteTitle)
    }
  }

  return links
}

/**
 * Convert note links in markdown to HTML links
 * [[Note Title]] -> <a href="/notes?search=Note Title">Note Title</a>
 */
export function convertNoteLinksToHtml(content: string): string {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  
  return content.replace(linkRegex, (match, noteTitle) => {
    const title = noteTitle.trim()
    const encodedTitle = encodeURIComponent(title)
    return `<a href="/notes?search=${encodedTitle}" class="note-link text-blue-600 dark:text-blue-400 hover:underline font-medium" data-note-title="${title}">${title}</a>`
  })
}

/**
 * Check if content contains note links
 */
export function hasNoteLinks(content: string): boolean {
  return /\[\[([^\]]+)\]\]/.test(content)
}

