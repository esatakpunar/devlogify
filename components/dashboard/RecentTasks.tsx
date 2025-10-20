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

interface Task {
  id: string
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
  tasks: Task[]
  userId: string
}

export function RecentTasks({ tasks, userId }: RecentTasksProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set())
  const { isRunning, taskId: activeTaskId, startTimer } = useTimerStore()

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
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const handleStartTimer = async (task: Task) => {
    if (isRunning) {
      toast.error('Stop the current timer first')
      return
    }

    try {
      await startTimer(task.id, task.title, userId)
      toast.success(`Started timer for "${task.title}"`)
    } catch (error) {
      toast.error('Failed to start timer')
      console.error('Timer start error:', error)
    }
  }

  const handleMarkComplete = async (taskId: string) => {
    setLoadingTasks(prev => new Set(prev).add(taskId))
    
    // Optimistic update: immediately remove task from list
    setLocalTasks(prev => prev.filter(task => task.id !== taskId))
    
    try {
      await updateTaskStatus(taskId, 'done')
      toast.success('Task marked as complete!')
    } catch (error) {
      // Revert optimistic update on error
      setLocalTasks(tasks)
      toast.error('Failed to mark task as complete')
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
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No incomplete tasks found</p>
          <p className="text-sm">Create some tasks to get started!</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
      <div className="space-y-3">
        {localTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/projects/${task.project.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                >
                  {task.title}
                </Link>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: task.project.color + '20', color: task.project.color }}
                >
                  {task.project.title}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(task.actual_duration)}
                </span>
                <span>•</span>
                <span>{formatLastUpdated(task.updated_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-3">
              {activeTaskId === task.id ? (
                <Badge variant="default" className="text-xs">
                  Running
                </Badge>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartTimer(task)}
                    disabled={isRunning || loadingTasks.has(task.id)}
                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title="Start timer"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkComplete(task.id)}
                    disabled={loadingTasks.has(task.id)}
                    className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                    title="Mark as complete"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {localTasks.length >= 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="w-full">
              View all projects
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
