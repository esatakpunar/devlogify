/**
 * Error handling utilities for user-friendly error messages
 */

export interface ErrorWithRetry {
  message: string
  retry?: () => void | Promise<void>
  code?: string
}

/**
 * Convert Supabase errors to user-friendly messages
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'An unexpected error occurred'

  // Handle specific Supabase error codes
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'The requested item was not found'
      case '23505':
        return 'This item already exists'
      case '23503':
        return 'Cannot delete this item because it is being used elsewhere'
      case '42501':
        return 'You do not have permission to perform this action'
      case 'PGRST301':
        return 'The request timed out. Please try again'
      case '08000':
      case '08003':
      case '08006':
        return 'Connection error. Please check your internet connection'
      default:
        break
    }
  }

  // Handle error messages
  if (error.message) {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection'
    }

    if (message.includes('timeout')) {
      return 'Request timed out. Please try again'
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'You do not have permission to perform this action'
    }

    if (message.includes('not found')) {
      return 'The requested item was not found'
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      return 'This item already exists'
    }

    if (message.includes('constraint') || message.includes('violation')) {
      return 'Invalid data provided. Please check your input'
    }
  }

  // Fallback to original message if it's user-friendly, otherwise generic message
  if (error.message && error.message.length < 100) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again'
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false

  const message = error.message?.toLowerCase() || ''
  const code = error.code || ''

  // Network errors are retryable
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    code === '08000' ||
    code === '08003' ||
    code === '08006' ||
    code === 'PGRST301'
  ) {
    return true
  }

  return false
}

/**
 * Create error with retry capability
 */
export function createErrorWithRetry(
  error: any,
  retryFn?: () => void | Promise<void>
): ErrorWithRetry {
  return {
    message: formatSupabaseError(error),
    retry: retryFn,
    code: error?.code,
  }
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: any, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error)
  }
}

