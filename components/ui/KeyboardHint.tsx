'use client'

import { useShortcutsStore } from '@/lib/store/shortcutsStore'
import { cn } from '@/lib/utils'

interface KeyboardHintProps {
  shortcutId: string
  className?: string
  showOnHover?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    Meta: '⌘',
    Control: 'Ctrl',
    Shift: '⇧',
    Alt: '⌥',
    Enter: '↵',
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  }

  return keyMap[key] || key.toUpperCase()
}

export function KeyboardHint({ 
  shortcutId, 
  className,
  showOnHover = false,
  size = 'sm'
}: KeyboardHintProps) {
  const { getShortcutKeys } = useShortcutsStore()
  const keys = getShortcutKeys(shortcutId)

  if (keys.length === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-2.5 py-1.5 gap-1.5',
  }

  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded border border-gray-300 dark:border-gray-600',
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
        'font-mono font-medium',
        sizeClasses[size],
        showOnHover && 'opacity-0 group-hover:opacity-100 transition-opacity',
        className
      )}
    >
      {keys.map((key, index) => (
        <span key={index}>
          {formatKey(key)}
          {index < keys.length - 1 && <span className="mx-0.5">+</span>}
        </span>
      ))}
    </kbd>
  )
}

