'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useShortcutsStore } from '@/lib/store/shortcutsStore'
import { Keyboard } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'Meta': '⌘',
    'Control': 'Ctrl',
    'Shift': '⇧',
    'Alt': '⌥',
    'Escape': 'Esc',
    'Enter': '↵',
    'Backspace': '⌫',
    'Delete': '⌦',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
  }
  return keyMap[key] || key.toUpperCase()
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  const t = useTranslation()
  const { shortcuts, getShortcutKeys } = useShortcutsStore()
  
  const categories = ['global', 'navigation', 'task', 'editor'] as const
  const categoryLabels: Record<string, string> = {
    global: 'Global Shortcuts',
    navigation: 'Navigation',
    task: 'Task Management',
    editor: 'Editor',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => {
            const categoryShortcuts = shortcuts.filter((s) => s.category === category)
            if (categoryShortcuts.length === 0) return null

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid gap-2">
                  {categoryShortcuts.map((shortcut) => {
                    const keys = getShortcutKeys(shortcut.id)
                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {keys.map((key, keyIndex) => (
                            <span key={keyIndex}>
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-sm">
                                {formatKey(key)}
                              </kbd>
                              {keyIndex < keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Note:</strong> Shortcuts work globally except when typing in input fields.
              On Windows/Linux, use <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">Ctrl</kbd> instead of{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">⌘</kbd>.
              Sequence shortcuts (like <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">g</kbd> then <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">d</kbd>) must be pressed quickly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

