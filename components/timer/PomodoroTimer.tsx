'use client'

import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { usePomodoroStore, startPomodoroInterval, stopPomodoroInterval } from '@/lib/store/pomodoroStore'
import { PomodoroSettings } from '@/components/timer/PomodoroSettings'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function PomodoroTimer() {
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

  const [showSettings, setShowSettings] = useState(false)
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
        return 'text-red-600'
      case 'shortBreak':
        return 'text-green-600'
      case 'longBreak':
        return 'text-blue-600'
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{t('pomodoro.title')}</h3>
            <p className={`text-sm font-medium ${getPhaseColor()}`}>
              {getPhaseLabel()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold mb-2">{formatTime(timeRemaining)}</div>
          <div className="text-sm text-gray-500">
            {completedPomodorosToday} {completedPomodorosToday !== 1 ? t('pomodoro.pomodorosTodayPlural') : t('pomodoro.pomodorosToday')} {t('pomodoro.today')}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <ProgressBar value={getProgress()} size="md" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isRunning ? (
            <Button onClick={start} size="lg">
              <Play className="w-4 h-4 mr-2" />
              {t('timer.start')}
            </Button>
          ) : (
            <Button onClick={pause} size="lg" variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              {t('timer.pause')}
            </Button>
          )}
          
          {isPaused && (
            <Button onClick={resume} size="lg">
              <Play className="w-4 h-4 mr-2" />
              {t('timer.resume')}
            </Button>
          )}

          <Button onClick={skip} variant="outline" size="lg">
            <SkipForward className="w-4 h-4 mr-2" />
            {t('pomodoro.skip')}
          </Button>

          <Button onClick={reset} variant="outline" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('timer.reset')}
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('pomodoro.totalPomodoros')}</span>
            <span className="font-semibold">{completedPomodoros}</span>
          </div>
        </div>
      </Card>

      {showSettings && (
        <PomodoroSettings
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      )}
    </>
  )
}

