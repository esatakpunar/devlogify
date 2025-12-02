'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTimerStore } from '@/lib/store/timerStore'
import { useShortcutsStore } from '@/lib/store/shortcutsStore'

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  preventDefault?: boolean
  sequence?: string[] // For sequence shortcuts like 'g' then 'd'
}

export function useKeyboardShortcuts(config: {
  onCreateTask?: () => void
  onCreateNote?: () => void
  onCreateProject?: () => void
  onShowShortcuts?: () => void
  onOpenCommandPalette?: () => void
  onSearch?: () => void
  onEditTask?: (taskId?: string) => void
  onDeleteTask?: (taskId?: string) => void
  onToggleTask?: (taskId?: string) => void
  selectedTaskId?: string | null
  userId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isRunning, stopTimer, startTimer } = useTimerStore()
  const { getShortcutKeys } = useShortcutsStore()
  const sequenceRef = useRef<string[]>([])
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = []

    // Get shortcut keys from store
    const getKeys = (id: string) => getShortcutKeys(id)

    // Command palette
    if (config.onOpenCommandPalette) {
      const keys = getKeys('command-palette')
      if (keys.length >= 2) {
        shortcuts.push({
          key: keys[1].toLowerCase(),
          metaKey: keys[0].toLowerCase() === 'meta',
          ctrlKey: keys[0].toLowerCase() === 'control',
          action: () => {
            const activeElement = document.activeElement
            if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
              config.onOpenCommandPalette?.()
            }
          },
          description: 'Open Command Palette',
          preventDefault: true,
        })
      }
    }

    // New item (context-aware)
    if (config.onCreateTask || config.onCreateNote || config.onCreateProject) {
      const keys = getKeys('new-item')
      if (keys.length >= 2) {
        const hasShift = keys.includes('Shift')
        shortcuts.push({
          key: keys[keys.length - 1].toLowerCase(), // Last key is the actual key
          metaKey: keys[0].toLowerCase() === 'meta',
          ctrlKey: keys[0].toLowerCase() === 'control',
          shiftKey: hasShift,
          action: () => {
            const activeElement = document.activeElement
            if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
              // Context-aware: check current page
              if (pathname?.includes('/projects')) {
                if (config.onCreateTask) {
                  config.onCreateTask()
                } else if (config.onCreateProject) {
                  config.onCreateProject()
                }
              } else if (pathname?.includes('/notes')) {
                config.onCreateNote?.()
              } else {
                if (config.onCreateTask) {
                  config.onCreateTask()
                } else if (config.onCreateNote) {
                  config.onCreateNote()
                } else if (config.onCreateProject) {
                  config.onCreateProject()
                }
              }
            }
          },
          description: 'Create New Item',
          preventDefault: true,
        })
      }
    }

    // Search
    if (config.onSearch) {
      const keys = getKeys('search')
      if (keys.length >= 2) {
        const hasShift = keys.includes('Shift')
        shortcuts.push({
          key: keys[keys.length - 1].toLowerCase(), // Last key is the actual key
          metaKey: keys[0].toLowerCase() === 'meta',
          ctrlKey: keys[0].toLowerCase() === 'control',
          shiftKey: hasShift,
          action: () => {
            const activeElement = document.activeElement
            if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
              config.onSearch?.()
            }
          },
          description: 'Open Search',
          preventDefault: true,
        })
      }
    }

    // Show shortcuts help
    if (config.onShowShortcuts) {
      const keys = getKeys('shortcuts-help')
      if (keys.length >= 2) {
        shortcuts.push({
          key: keys[1].toLowerCase(),
          shiftKey: keys[0].toLowerCase() === 'shift',
          action: () => {
            const activeElement = document.activeElement
            if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
              config.onShowShortcuts?.()
            }
          },
          description: 'Show Keyboard Shortcuts',
          preventDefault: true,
        })
      }
    }

    // Navigation shortcuts (sequence-based: g then letter)
    const navShortcuts = [
      { id: 'nav-dashboard', path: '/dashboard' },
      { id: 'nav-projects', path: '/projects' },
      { id: 'nav-timeline', path: '/timeline' },
      { id: 'nav-analytics', path: '/analytics' },
      { id: 'nav-notes', path: '/notes' },
      { id: 'nav-settings', path: '/settings' },
    ]

    navShortcuts.forEach(({ id, path }) => {
      const keys = getKeys(id)
      if (keys.length >= 2) {
        shortcuts.push({
          key: keys[0].toLowerCase(),
          sequence: keys,
          action: () => router.push(path),
          description: `Go to ${path.replace('/', '').charAt(0).toUpperCase() + path.slice(2)}`,
          preventDefault: true,
        })
      }
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const activeElement = document.activeElement
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      ) {
        // Allow Escape to close dialogs even when typing
        if (e.key === 'Escape') {
          // Close any open dialogs
          const dialogs = document.querySelectorAll('[role="dialog"]')
          dialogs.forEach((dialog) => {
            const closeButton = dialog.querySelector('[data-dialog-close]')
            if (closeButton) {
              ;(closeButton as HTMLElement).click()
            }
          })
        }
        return
      }

      // Skip if key is undefined (can happen with some keyboard events)
      if (!e.key) {
        return
      }

      // Handle sequence shortcuts (like 'g' then 'd')
      if (sequenceRef.current.length > 0) {
        const currentSequence = [...sequenceRef.current, e.key.toLowerCase()]
        
        // Check if this completes any sequence shortcut
        for (const shortcut of shortcuts) {
          if (shortcut.sequence && shortcut.sequence.length === currentSequence.length) {
            const matches = shortcut.sequence.every((key, index) => 
              key.toLowerCase() === currentSequence[index]
            )
            if (matches) {
              if (shortcut.preventDefault) {
                e.preventDefault()
              }
              shortcut.action()
              sequenceRef.current = []
              if (sequenceTimeoutRef.current) {
                clearTimeout(sequenceTimeoutRef.current)
              }
              return
            }
          }
        }
        
        // If sequence doesn't match, reset after timeout
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current)
        }
        sequenceTimeoutRef.current = setTimeout(() => {
          sequenceRef.current = []
        }, 1000)
      }

      // Check for sequence start
      for (const shortcut of shortcuts) {
        if (shortcut.sequence && shortcut.sequence.length > 1) {
          if (e.key.toLowerCase() === shortcut.sequence[0].toLowerCase()) {
            sequenceRef.current = [e.key.toLowerCase()]
            if (shortcut.preventDefault) {
              e.preventDefault()
            }
            // Set timeout to reset sequence if no follow-up key
            if (sequenceTimeoutRef.current) {
              clearTimeout(sequenceTimeoutRef.current)
            }
            sequenceTimeoutRef.current = setTimeout(() => {
              sequenceRef.current = []
            }, 1000)
            return
          }
        }
      }

      // Check each shortcut (non-sequence)
      for (const shortcut of shortcuts) {
        // Skip sequence shortcuts
        if (shortcut.sequence) continue
        
        // Skip if key is undefined (can happen with some keyboard events)
        if (!e.key || !shortcut.key) {
          continue
        }
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey
        const metaMatch = shortcut.metaKey ? (e.metaKey || e.ctrlKey) : !e.metaKey && !e.ctrlKey
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault) {
            e.preventDefault()
          }
          shortcut.action()
          break
        }
      }

      // Global Escape handler
      if (e.key === 'Escape') {
        // Close any open dialogs
        const dialogs = document.querySelectorAll('[role="dialog"]')
        dialogs.forEach((dialog) => {
          const closeButton = dialog.querySelector('[data-dialog-close]')
          if (closeButton) {
            ;(closeButton as HTMLElement).click()
          }
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current)
      }
    }
  }, [
    router,
    pathname,
    isRunning,
    stopTimer,
    config.onCreateTask,
    config.onCreateNote,
    config.onCreateProject,
    config.onShowShortcuts,
    config.onOpenCommandPalette,
    config.onSearch,
    config.onEditTask,
    config.onDeleteTask,
    config.onToggleTask,
    config.selectedTaskId,
    config.userId,
    getShortcutKeys,
  ])
}

// Export shortcuts list for help modal (will be generated from store)
export function getKeyboardShortcuts() {
  const { shortcuts } = useShortcutsStore.getState()
  return shortcuts.map((s) => ({
    keys: s.keys,
    description: s.description,
    category: s.category,
  }))
}

