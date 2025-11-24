'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTimerStore } from '@/lib/store/timerStore'

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(config: {
  onCreateTask?: () => void
  onCreateNote?: () => void
  onCreateProject?: () => void
  onShowShortcuts?: () => void
  onOpenCommandPalette?: () => void
  userId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isRunning, stopTimer, startTimer } = useTimerStore()

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = []

    // Command palette - Most important, keep this
    if (config.onOpenCommandPalette) {
      shortcuts.push({
        key: 'k',
        metaKey: true,
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

    // Show shortcuts help
    if (config.onShowShortcuts) {
      shortcuts.push({
        key: '?',
        shiftKey: true,
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

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      const activeElement = document.activeElement
      if (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.isContentEditable
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

      // Check each shortcut
      for (const shortcut of shortcuts) {
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
    config.userId,
  ])
}

// Export shortcuts list for help modal
export const keyboardShortcuts = [
  { keys: ['⌘', 'K'], description: 'Open Command Palette' },
  { keys: ['⇧', '?'], description: 'Show Keyboard Shortcuts' },
  { keys: ['Esc'], description: 'Close Dialogs' },
]

