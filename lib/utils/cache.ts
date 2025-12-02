/**
 * Simple in-memory cache with stale-while-revalidate pattern
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

type CacheKey = string

class SimpleCache {
  private cache: Map<CacheKey, CacheEntry<any>> = new Map()

  /**
   * Get data from cache
   * Returns null if cache miss or expired
   */
  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const isExpired = now - entry.timestamp > entry.ttl

    if (isExpired) {
      // Remove expired entry
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set data in cache
   */
  set<T>(key: CacheKey, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Check if cache entry exists and is still valid
   */
  has(key: CacheKey): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    const isExpired = now - entry.timestamp > entry.ttl

    if (isExpired) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Check if cache entry exists but might be stale
   * Used for stale-while-revalidate pattern
   */
  hasStale(key: CacheKey): boolean {
    return this.cache.has(key)
  }

  /**
   * Get stale data (even if expired)
   * Used for stale-while-revalidate pattern
   */
  getStale<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key)
    return entry ? (entry.data as T) : null
  }

  /**
   * Remove entry from cache
   */
  delete(key: CacheKey): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
}

// Singleton instance
const cache = new SimpleCache()

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  DASHBOARD: 30 * 1000, // 30 seconds
  PROJECTS: 5 * 60 * 1000, // 5 minutes
  NOTES: 5 * 60 * 1000, // 5 minutes
  TASKS: 2 * 60 * 1000, // 2 minutes
  ANALYTICS: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
} as const

/**
 * Stale-while-revalidate pattern
 * Returns cached data immediately if available (even if stale),
 * then fetches fresh data in the background
 */
export async function staleWhileRevalidate<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.DASHBOARD
): Promise<T> {
  // Return stale data immediately if available
  const staleData = cache.getStale<T>(key)
  
  // Check if we have fresh data
  const freshData = cache.get<T>(key)
  
  if (freshData) {
    return freshData
  }

  // If we have stale data, return it and fetch fresh in background
  if (staleData) {
    // Fetch fresh data in background (don't await)
    fetcher()
      .then((data) => {
        cache.set(key, data, ttl)
      })
      .catch((error) => {
        console.error(`Cache revalidation failed for ${key}:`, error)
      })
    
    return staleData
  }

  // No cache, fetch fresh data
  const data = await fetcher()
  cache.set(key, data, ttl)
  return data
}

/**
 * Simple cache get/set helpers
 */
export function getCached<T>(key: CacheKey): T | null {
  return cache.get<T>(key)
}

export function setCached<T>(key: CacheKey, data: T, ttl: number = CACHE_TTL.DASHBOARD): void {
  cache.set(key, data, ttl)
}

export function invalidateCache(key: CacheKey): void {
  cache.delete(key)
}

export function clearCache(): void {
  cache.clear()
}

/**
 * Generate cache key from parts
 */
export function cacheKey(...parts: (string | number | undefined)[]): CacheKey {
  return parts.filter(Boolean).join(':')
}

export default cache

