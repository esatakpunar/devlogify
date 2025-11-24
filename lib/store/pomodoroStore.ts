'use client'

import { create } from 'zustand'

export interface PomodoroSettings {
  workDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  pomodorosUntilLongBreak: number
}

export interface PomodoroState {
  // Current session
  currentPhase: 'work' | 'shortBreak' | 'longBreak'
  timeRemaining: number // seconds
  isRunning: boolean
  isPaused: boolean
  
  // Pomodoro count
  completedPomodoros: number
  completedPomodorosToday: number
  
  // Settings
  settings: PomodoroSettings
}

interface PomodoroStore extends PomodoroState {
  setSettings: (settings: Partial<PomodoroSettings>) => void
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  skip: () => void
  tick: () => void
  completePhase: () => void
}

const POMODORO_KEY = 'devlogify_pomodoro_state'
const POMODORO_SETTINGS_KEY = 'devlogify_pomodoro_settings'

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosUntilLongBreak: 4,
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => {
  // Load settings from localStorage
  const loadSettings = (): PomodoroSettings => {
    if (typeof window === 'undefined') return defaultSettings
    const saved = localStorage.getItem(POMODORO_SETTINGS_KEY)
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) }
      } catch {
        return defaultSettings
      }
    }
    return defaultSettings
  }

  const settings = loadSettings()

  return {
    currentPhase: 'work',
    timeRemaining: settings.workDuration * 60,
    isRunning: false,
    isPaused: false,
    completedPomodoros: 0,
    completedPomodorosToday: 0,
    settings,

    setSettings: (newSettings: Partial<PomodoroSettings>) => {
      const updatedSettings = { ...get().settings, ...newSettings }
      set({ settings: updatedSettings })
      if (typeof window !== 'undefined') {
        localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(updatedSettings))
      }
      // Reset if settings changed
      get().reset()
    },

    start: () => {
      const state = get()
      if (state.isRunning) return

      set({
        isRunning: true,
        isPaused: false,
      })

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(POMODORO_KEY, JSON.stringify({
          currentPhase: state.currentPhase,
          timeRemaining: state.timeRemaining,
          isRunning: true,
          completedPomodoros: state.completedPomodoros,
          completedPomodorosToday: state.completedPomodorosToday,
        }))
      }
    },

    pause: () => {
      set({ isRunning: false, isPaused: true })
    },

    resume: () => {
      set({ isRunning: true, isPaused: false })
    },

    reset: () => {
      const state = get()
      set({
        currentPhase: 'work',
        timeRemaining: state.settings.workDuration * 60,
        isRunning: false,
        isPaused: false,
      })
      if (typeof window !== 'undefined') {
        localStorage.removeItem(POMODORO_KEY)
      }
    },

    skip: () => {
      get().completePhase()
    },

    tick: () => {
      const state = get()
      if (!state.isRunning || state.isPaused) return

      if (state.timeRemaining <= 0) {
        get().completePhase()
        return
      }

      set({ timeRemaining: state.timeRemaining - 1 })
    },

    completePhase: () => {
      const state = get()
      
      if (state.currentPhase === 'work') {
        const newCompleted = state.completedPomodoros + 1
        const newTodayCompleted = state.completedPomodorosToday + 1
        const shouldLongBreak = newCompleted % state.settings.pomodorosUntilLongBreak === 0
        
        set({
          currentPhase: shouldLongBreak ? 'longBreak' : 'shortBreak',
          timeRemaining: shouldLongBreak 
            ? state.settings.longBreakDuration * 60
            : state.settings.shortBreakDuration * 60,
          completedPomodoros: newCompleted,
          completedPomodorosToday: newTodayCompleted,
          isRunning: false,
          isPaused: false,
        })

        // Show notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Pomodoro Complete! 🎉', {
            body: 'Time for a break!',
          })
        }
      } else {
        // Break finished, start work
        set({
          currentPhase: 'work',
          timeRemaining: state.settings.workDuration * 60,
          isRunning: false,
          isPaused: false,
        })

        // Show notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Break Over! 💪', {
            body: 'Time to get back to work!',
          })
        }
      }

      // Save state
      if (typeof window !== 'undefined') {
        localStorage.setItem(POMODORO_KEY, JSON.stringify({
          currentPhase: get().currentPhase,
          timeRemaining: get().timeRemaining,
          isRunning: false,
          completedPomodoros: get().completedPomodoros,
          completedPomodorosToday: get().completedPomodorosToday,
        }))
      }
    },
  }
})

// Load state from localStorage on init
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(POMODORO_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      usePomodoroStore.setState({
        currentPhase: parsed.currentPhase || 'work',
        timeRemaining: parsed.timeRemaining || 25 * 60,
        completedPomodoros: parsed.completedPomodoros || 0,
        completedPomodorosToday: parsed.completedPomodorosToday || 0,
      })
    } catch {
      // Ignore parse errors
    }
  }

  // Reset daily count at midnight
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  const msUntilMidnight = midnight.getTime() - now.getTime()
  
  setTimeout(() => {
    usePomodoroStore.setState({ completedPomodorosToday: 0 })
  }, msUntilMidnight)
}

// Pomodoro tick interval
let pomodoroInterval: NodeJS.Timeout | null = null

export function startPomodoroInterval() {
  if (pomodoroInterval) return
  
  pomodoroInterval = setInterval(() => {
    usePomodoroStore.getState().tick()
  }, 1000)
}

export function stopPomodoroInterval() {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval)
    pomodoroInterval = null
  }
}

