'use client'

import { useState, useEffect, useCallback } from 'react'

const SIDEBAR_COLLAPSED_KEY = 'devlogify_sidebar_collapsed'

/**
 * Custom hook for managing sidebar collapse state with localStorage persistence
 * Optimized to prevent unnecessary re-renders
 */
export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    // Initialize from localStorage only on client side
    if (typeof window === 'undefined') return false
    
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      return saved === 'true'
    } catch {
      return false
    }
  })

  // Load from localStorage on mount (handles SSR hydration)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (saved !== null) {
        setIsCollapsedState(saved === 'true')
      }
    } catch (error) {
      console.error('Failed to load sidebar state from localStorage:', error)
    }
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsedState((prev) => {
      const newState = !prev
      
      // Persist to localStorage
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState))
      } catch (error) {
        console.error('Failed to save sidebar state to localStorage:', error)
      }
      
      return newState
    })
  }, [])

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed)
    
    // Persist to localStorage
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage:', error)
    }
  }, [])

  return {
    isCollapsed,
    toggleCollapse,
    setCollapsed,
  }
}

