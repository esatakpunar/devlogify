'use client'

import { useEffect } from 'react'
import { useTimerStore, startTimerInterval, stopTimerInterval } from '@/lib/store/timerStore'

export function useTimer() {
  const store = useTimerStore()

  // Component mount olduğunda storage'dan yükle
  useEffect(() => {
    store.loadFromStorage()
  }, [])

  // Timer çalışırken interval başlat
  useEffect(() => {
    if (store.isRunning) {
      startTimerInterval()
    } else {
      stopTimerInterval()
    }

    return () => {
      stopTimerInterval()
    }
  }, [store.isRunning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return {
    ...store,
    formatTime,
  }
}