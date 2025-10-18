import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

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
  stopTimer: (userId: string, note?: string) => Promise<void>
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
    const supabase = createClient()
    const startTime = new Date()

    // Time entry oluştur
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        task_id: taskId,
        user_id: userId,
        started_at: startTime.toISOString(),
        is_manual: false,
      })
      .select()
      .single()

    if (error) throw error

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

  stopTimer: async (userId: string, note?: string) => {
    const state = get()
    if (!state.taskId || !state.startTime) return
  
    const supabase = createClient()
    const endTime = new Date()
    const durationMinutes = Math.floor(state.elapsed / 60)
  
    // Time entry'yi güncelle
    const { error } = await supabase
      .from('time_entries')
      .update({
        ended_at: endTime.toISOString(),
        duration: durationMinutes,
        note: note || null,
      })
      .eq('task_id', state.taskId)
      .eq('user_id', userId)
      .is('ended_at', null)
  
    if (error) throw error
  
    // Task'ın actual_duration'ını güncelle
    const { data: task } = await supabase
      .from('tasks')
      .select('actual_duration, project_id')
      .eq('id', state.taskId)
      .single()
  
    if (task) {
      await supabase
        .from('tasks')
        .update({
          actual_duration: task.actual_duration + durationMinutes
        })
        .eq('id', state.taskId)
      
      // Activity log ekle
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          project_id: task.project_id,
          task_id: state.taskId,
          action_type: 'time_logged',
          metadata: {
            duration: durationMinutes,
            task_title: state.taskTitle
          }
        })
    }
  
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