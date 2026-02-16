/**
 * Sharing utilities for collaboration features
 */

import { generateSecureToken } from '@/lib/utils/crypto'

/**
 * Generate a unique share token
 */
export function generateShareToken(): string {
  return generateSecureToken(20)
}

/**
 * Get share URL
 */
export function getShareUrl(token: string): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return `${window.location.origin}/share/${token}`
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
