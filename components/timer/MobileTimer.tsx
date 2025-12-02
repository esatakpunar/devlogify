'use client'

import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { usePomodoroStore, startPomodoroInterval, stopPomodoroInterval } from '@/lib/store/pomodoroStore'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function MobileTimer() {
  const {
    currentPhase,
    timeRemaining,
    isRunning,
    isPaused,
    completedPomodoros,
    completedPomodorosToday,
    settings,
    start,
    pause,
    resume,
    reset,
    skip,
  } = usePomodoroStore()

  const t = useTranslation()

  useEffect(() => {
    startPomodoroInterval()
    return () => {
      stopPomodoroInterval()
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'work':
        return t('pomodoro.focusTime')
      case 'shortBreak':
        return t('timer.shortBreak')
      case 'longBreak':
        return t('timer.longBreak')
    }
  }

  const getProgress = () => {
    const total = currentPhase === 'work'
      ? settings.workDuration * 60
      : currentPhase === 'shortBreak'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60
    
    return ((total - timeRemaining) / total) * 100
  }

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'work':
        return 'text-red-600 dark:text-red-400'
      case 'shortBreak':
        return 'text-green-600 dark:text-green-400'
      case 'longBreak':
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <Card className="md:hidden p-4">
      <div className="text-center">
        {/* Phase Label */}
        <p className={`text-sm font-medium mb-2 ${getPhaseColor()}`}>
          {getPhaseLabel()}
        </p>

        {/* Timer Display */}
        <div className="mb-6">
          <div className="text-5xl font-bold mb-2">
            {formatTime(timeRemaining)}
          </div>
          <ProgressBar value={getProgress()} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-semibold">{completedPomodorosToday}</span>
            <span className="ml-1">Today</span>
          </div>
          <div>
            <span className="font-semibold">{completedPomodoros}</span>
            <span className="ml-1">Total</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          {!isRunning && !isPaused ? (
            <Button
              size="lg"
              onClick={start}
              className="rounded-full w-16 h-16"
            >
              <Play className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={isPaused ? resume : pause}
              className="rounded-full w-16 h-16"
            >
              {isPaused ? (
                <Play className="w-6 h-6" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={skip}
            className="rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

