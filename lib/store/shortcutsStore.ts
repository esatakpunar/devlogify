'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface ShortcutBinding {
  id: string
  keys: string[]
  description: string
  defaultKeys: string[]
  category: 'global' | 'navigation' | 'task' | 'editor'
}

const defaultShortcuts: ShortcutBinding[] = [
  // Global shortcuts
  {
    id: 'command-palette',
    keys: ['Meta', 'k'],
    defaultKeys: ['Meta', 'k'],
    description: 'Open Command Palette',
    category: 'global',
  },
  {
    id: 'new-item',
    keys: ['Meta', 'Shift', 'n'],
    defaultKeys: ['Meta', 'Shift', 'n'],
    description: 'Create New Item (context-aware)',
    category: 'global',
  },
  {
    id: 'search',
    keys: ['Meta', 'Shift', 'f'],
    defaultKeys: ['Meta', 'Shift', 'f'],
    description: 'Open Search',
    category: 'global',
  },
  {
    id: 'shortcuts-help',
    keys: ['Shift', '?'],
    defaultKeys: ['Shift', '?'],
    description: 'Show Keyboard Shortcuts',
    category: 'global',
  },
  // Navigation shortcuts
  {
    id: 'nav-dashboard',
    keys: ['g', 'd'],
    defaultKeys: ['g', 'd'],
    description: 'Go to Dashboard',
    category: 'navigation',
  },
  {
    id: 'nav-projects',
    keys: ['g', 'p'],
    defaultKeys: ['g', 'p'],
    description: 'Go to Projects',
    category: 'navigation',
  },
  {
    id: 'nav-kanban',
    keys: ['g', 'k'],
    defaultKeys: ['g', 'k'],
    description: 'Go to Kanban',
    category: 'navigation',
  },
  {
    id: 'nav-timeline',
    keys: ['g', 't'],
    defaultKeys: ['g', 't'],
    description: 'Go to Timeline',
    category: 'navigation',
  },
  {
    id: 'nav-analytics',
    keys: ['g', 'a'],
    defaultKeys: ['g', 'a'],
    description: 'Go to Analytics',
    category: 'navigation',
  },
  {
    id: 'nav-notes',
    keys: ['g', 'n'],
    defaultKeys: ['g', 'n'],
    description: 'Go to Notes',
    category: 'navigation',
  },
  {
    id: 'nav-settings',
    keys: ['g', 's'],
    defaultKeys: ['g', 's'],
    description: 'Go to Settings',
    category: 'navigation',
  },
]

interface ShortcutsState {
  shortcuts: ShortcutBinding[]
  customBindings: Record<string, string[]>
  setShortcut: (id: string, keys: string[]) => void
  resetShortcut: (id: string) => void
  resetAll: () => void
  getShortcut: (id: string) => ShortcutBinding | undefined
  getShortcutKeys: (id: string) => string[]
}

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: defaultShortcuts,
      customBindings: {},
      setShortcut: (id, keys) => {
        set((state) => ({
          customBindings: {
            ...state.customBindings,
            [id]: keys,
          },
        }))
      },
      resetShortcut: (id) => {
        set((state) => {
          const newBindings = { ...state.customBindings }
          delete newBindings[id]
          return { customBindings: newBindings }
        })
      },
      resetAll: () => {
        set({ customBindings: {} })
      },
      getShortcut: (id) => {
        return get().shortcuts.find((s) => s.id === id)
      },
      getShortcutKeys: (id) => {
        const state = get()
        const shortcut = state.shortcuts.find((s) => s.id === id)
        if (!shortcut) return []
        return state.customBindings[id] || shortcut.defaultKeys
      },
    }),
    {
      name: 'devlogify-shortcuts',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
