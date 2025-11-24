'use client'

import { useState, useEffect } from 'react'
import { Play, Square, Clock, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTimerStore } from '@/lib/store/timerStore'
import { getRecentIncompleteTasks } from '@/lib/supabase/queries/tasks'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Task {
  id: string
  title: string
  project: {
    id: string
    title: string
    color: string
  }
}

interface QuickTimerCardProps {
  userId: string
}

export function QuickTimerCard({ userId }: QuickTimerCardProps) {
  const { 
    isRunning, 
    taskId, 
    taskTitle, 
    elapsed, 
    startTimer, 
    stopTimer 
  } = useTimerStore()
  const t = useTranslation()
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isRunning) {
      loadAvailableTasks()
    }
  }, [isRunning, userId])

  const loadAvailableTasks = async () => {
    try {
      const tasks = await getRecentIncompleteTasks(userId, 5)
      setAvailableTasks(tasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const handleStartTimer = async (task: Task) => {
    setLoading(true)
    try {
      await startTimer(task.id, task.title, userId)
      toast.success(t('tasks.startedTimerFor', { title: task.title }))
    } catch (error) {
      toast.error(t('tasks.failedToStartTimer'))
      console.error('Timer start error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStopTimer = async () => {
    setLoading(true)
    try {
      await stopTimer(userId)
      toast.success(t('tasks.timerStopped'))
    } catch (error) {
      toast.error(t('tasks.failedToStopTimer'))
      console.error('Timer stop error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isRunning && taskId && taskTitle) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('timerCard.activeTimer')}</h3>
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            {t('common.running')}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              {taskTitle}
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-mono font-semibold">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
          
          <Button
            onClick={handleStopTimer}
            disabled={loading}
            className="w-full"
            variant="destructive"
          >
            <Square className="w-4 h-4 mr-2" />
            {t('timerCard.stopTimer')}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{t('timerCard.quickTimer')}</h3>
      
      {availableTasks.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Play className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{t('timerCard.noTasksAvailable')}</p>
          <p className="text-xs">{t('timerCard.createTasksToStart')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('timerCard.startTrackingForRecent')}
          </p>
          
          {availableTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <span className="text-xs text-gray-500">
                    {task.project.title}
                  </span>
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => handleStartTimer(task)}
                disabled={loading}
                className="ml-3 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                title={t('timerCard.startTimerForTask')}
              >
                <Play className="w-4 h-4 mr-1" />
                {t('timer.start')}
              </Button>
            </div>
          ))}
          
          {availableTasks.length > 3 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                +{availableTasks.length - 3} {t('timerCard.moreTasksAvailable')}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
