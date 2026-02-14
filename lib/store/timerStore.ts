import { create } from 'zustand'
import { startTimeEntry, stopTimeEntry } from '@/lib/supabase/queries/time_entries'
import { logTimeActivity } from '@/lib/supabase/queries/activities'

export interface TimerState {
  taskId: string | null
  taskTitle: string | null
  startTime: Date | null
  elapsed: number
  isRunning: boolean
}

interface TimerStore extends TimerState {
  setTimer: (state: Partial<TimerState>) => void
  startTimer: (taskId: string, taskTitle: string, userId: string) => Promise<void>
  stopTimer: (userId: string, note?: string, companyId?: string) => Promise<void>
  updateElapsed: () => void
  loadFromStorage: () => void
  reset: () => void
}

const TIMER_KEY = 'devlogify_active_timer'

export const useTimerStore = create<TimerStore>((set, get) => ({
  taskId: null,
  taskTitle: null,
  startTime: null,
  elapsed: 0,
  isRunning: false,

  setTimer: (state) => set(state),

  loadFromStorage: () => {
    const saved = localStorage.getItem(TIMER_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.isRunning && parsed.startTime) {
        const startTime = new Date(parsed.startTime)
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
        set({
          taskId: parsed.taskId,
          taskTitle: parsed.taskTitle,
          startTime,
          elapsed,
          isRunning: true,
        })
      }
    }
  },

  updateElapsed: () => {
    const state = get()
    if (state.isRunning && state.startTime) {
      const elapsed = Math.floor((Date.now() - state.startTime.getTime()) / 1000)
      set({ elapsed })
    }
  },

  startTimer: async (taskId: string, taskTitle: string, userId: string) => {
    const startTime = new Date()

    // Time entry oluştur
    await startTimeEntry(taskId, userId)

    // State'i güncelle
    set({
      taskId,
      taskTitle,
      startTime,
      elapsed: 0,
      isRunning: true,
    })

    // LocalStorage'a kaydet
    localStorage.setItem(TIMER_KEY, JSON.stringify({
      taskId,
      taskTitle,
      startTime: startTime.toISOString(),
      isRunning: true,
    }))
  },

  stopTimer: async (userId: string, note?: string, companyId?: string) => {
    const state = get()
    if (!state.taskId || !state.startTime) return

    const durationMinutes = Math.floor(state.elapsed / 60)

    // Time entry'yi güncelle ve task duration'ı güncelle
    const { projectId, companyId: resolvedCompanyId } = await stopTimeEntry(
      state.taskId,
      userId,
      durationMinutes,
      note
    )

    // Activity log ekle
    await logTimeActivity(
      userId,
      projectId,
      state.taskId,
      durationMinutes,
      state.taskTitle || '',
      false,
      companyId || resolvedCompanyId || null
    )

    // State'i sıfırla
    set({
      taskId: null,
      taskTitle: null,
      startTime: null,
      elapsed: 0,
      isRunning: false,
    })

    localStorage.removeItem(TIMER_KEY)
  },

  reset: () => {
    set({
      taskId: null,
      taskTitle: null,
      startTime: null,
      elapsed: 0,
      isRunning: false,
    })
    localStorage.removeItem(TIMER_KEY)
  },
}))

// Timer tick için interval (component'te kullanacağız)
let timerInterval: NodeJS.Timeout | null = null

export function startTimerInterval() {
  if (timerInterval) return
  
  timerInterval = setInterval(() => {
    useTimerStore.getState().updateElapsed()
  }, 1000)
}

export function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}
