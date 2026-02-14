'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Play, Check, Clock, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useTimerStore } from '@/lib/store/timerStore'
import { updateTaskStatus } from '@/lib/supabase/queries/tasks'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { formatSupabaseError, isRetryableError } from '@/lib/utils/errorHandler'

export interface RecentTaskItem {
  id: string
  task_number: number
  title: string
  status: 'todo' | 'in_progress' | 'done'
  actual_duration: number
  updated_at: string
  project: {
    id: string
    title: string
    color: string
  }
}

interface RecentTasksProps {
  tasks: RecentTaskItem[]
  userId: string
  onTaskCompleted?: (task: RecentTaskItem & { completed_at: string }) => void
}

export function RecentTasks({ tasks, userId, onTaskCompleted }: RecentTasksProps) {
  const [localTasks, setLocalTasks] = useState<RecentTaskItem[]>(tasks)
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set())
  const { isRunning, taskId: activeTaskId, startTimer } = useTimerStore()
  const t = useTranslation()

  // Update local tasks when props change
  React.useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return t('common.justNow')
    if (diffInHours < 24) return `${diffInHours}h ${t('common.ago')}`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ${t('common.ago')}`
  }

  const handleStartTimer = async (task: RecentTaskItem) => {
    if (isRunning) {
      toast.error(t('tasks.stopCurrentTimerFirst'))
      return
    }

    try {
      await startTimer(task.id, task.title, userId)
      toast.success(t('tasks.startedTimerFor', { title: task.title }))
    } catch (error: any) {
      const errorMessage = formatSupabaseError(error)
      const retryable = isRetryableError(error)
      toast.error(errorMessage, {
        action: retryable ? {
          label: t('common.retry'),
          onClick: () => handleStartTimer(task)
        } : undefined
      })
      console.error('Timer start error:', error)
    }
  }

  const handleMarkComplete = async (taskId: string) => {
    setLoadingTasks(prev => new Set(prev).add(taskId))
    
    // Optimistic update: immediately remove task from list
    setLocalTasks(prev => prev.filter(task => task.id !== taskId))
    
    try {
      await updateTaskStatus(taskId, 'done')
      toast.success(t('tasks.taskMarkedAsComplete'))
      const completedTask = tasks.find(task => task.id === taskId)
      if (completedTask) {
        onTaskCompleted?.({
          ...completedTask,
          completed_at: new Date().toISOString(),
        })
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setLocalTasks(tasks)
      const errorMessage = formatSupabaseError(error)
      const retryable = isRetryableError(error)
      toast.error(errorMessage, {
        action: retryable ? {
          label: t('common.retry'),
          onClick: () => handleMarkComplete(taskId)
        } : undefined
      })
      console.error('Mark complete error:', error)
    } finally {
      setLoadingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  if (localTasks.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('dashboard.recentTasks')}</h3>
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm sm:text-base">{t('dashboard.noIncompleteTasks')}</p>
          <p className="text-xs sm:text-sm">{t('dashboard.createSomeTasks')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('dashboard.recentTasks')}</h3>
      <div className="space-y-2 sm:space-y-3">
        {localTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <Link
                  href={`/projects/${task.project.id}`}
                  className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                >
                  #{task.task_number} {task.title}
                </Link>
                <Badge
                  variant="secondary"
                  className="text-xs flex-shrink-0"
                  style={{ backgroundColor: task.project.color + '20', color: task.project.color }}
                >
                  <span className="truncate max-w-[80px] sm:max-w-none">{task.project.title}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(task.actual_duration)}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>{formatLastUpdated(task.updated_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              {activeTaskId === task.id ? (
                <Badge variant="default" className="text-xs">
                  {t('common.running')}
                </Badge>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartTimer(task)}
                    disabled={isRunning || loadingTasks.has(task.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title={t('timer.start')}
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkComplete(task.id)}
                    disabled={loadingTasks.has(task.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                    title={t('tasks.taskMarkedAsComplete')}
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {localTasks.length >= 5 && (
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
              {t('dashboard.viewAllProjects')}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
