'use client'

import { useState } from 'react'
import { Clock, MoreVertical, Play, Square, ArrowRight, ArrowLeft, Edit, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { TimeProgressIndicator } from './TimeProgressIndicator'
import { ProgressSlider } from './ProgressSlider'
import { updateTaskStatus, deleteTask, getTask } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
import { useTimer } from '@/lib/hooks/useTimer'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { EditTaskDialog } from './EditTaskDialog'
import { AddManualTimeDialog } from './AddManualTimeDialog'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimated_duration: number | null
  actual_duration: number
  progress: number
  order_index: number
  created_at: string
  tags?: string[] | null
}

interface TaskCardProps {
  task: Task
  userId: string
  onTaskUpdated: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
}

const priorityColors = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200'
}

const statusStyles = {
  todo: 'border-gray-200 bg-white',
  in_progress: 'border-blue-200 bg-blue-50/30',
  done: 'border-green-200 bg-green-50/30'
}

export function TaskCard({ task, userId, onTaskUpdated, onTaskDeleted }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [localTask, setLocalTask] = useState(task)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false)
  const { taskId, isRunning, elapsed, startTimer, stopTimer, formatTime } = useTimer()
  const t = useTranslation()

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const isTimerActive = isRunning && taskId === task.id

  const handleStatusChange = async (newStatus: 'todo' | 'in_progress' | 'done') => {
    setLoading(true)
    try {
      const updatedTask = await updateTaskStatus(task.id, newStatus)
      
      // Activity log ekle
      await logActivity(
        userId,
        task.project_id,  // Artık bu var
        task.id,
        newStatus === 'done' ? 'task_completed' : 'task_status_changed',
        { 
          old_status: localTask.status,
          new_status: newStatus,
          task_title: localTask.title
        }
      )
      
      onTaskUpdated(updatedTask)
      setLocalTask(updatedTask)
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('tasks.areYouSureDeleteTask'))) return
    
    setLoading(true)
    try {
      await deleteTask(task.id)
      onTaskDeleted(task.id)
      toast.success(t('tasks.taskDeleted'))
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error(t('tasks.failedToDeleteTask'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartTimer = async () => {
    if (isRunning) {
      toast.error(t('tasks.pleaseStopCurrentTimer'))
      return
    }

    try {
      await startTimer(task.id, task.title, userId)
      if (task.status === 'todo') {
        await handleStatusChange('in_progress')
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
      toast.error(t('tasks.failedToStartTimer'))
    }
  }

  const handleStopTimer = async () => {
    setLoading(true)
    try {
      await stopTimer(userId)

      const updatedTask = await getTask(task.id)

      setLocalTask(updatedTask)
      onTaskUpdated(updatedTask)

      const durationMinutes = Math.floor(elapsed / 60)
      toast.success(t('tasks.timerStopped'), {
        description: t('tasks.loggedMinutes', { minutes: durationMinutes, title: task.title }),
      })
    } catch (error) {
      console.error('Failed to stop timer:', error)
      toast.error(t('tasks.failedToStopTimer'))
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setLocalTask(updatedTask)
    onTaskUpdated(updatedTask)
  }

  const handleTimeAdded = async (minutes: number) => {
    // Task'ı yeniden çek
    const updatedTask = await getTask(task.id)
    setLocalTask(updatedTask)
    onTaskUpdated(updatedTask)
  }

  const canMovePrevious = localTask.status !== 'todo'
  const canMoveNext = localTask.status !== 'done'
  
  const isOverTime = localTask.estimated_duration && localTask.actual_duration > localTask.estimated_duration

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        className={cn(
          "border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group",
          statusStyles[localTask.status],
          isTimerActive && 'border-l-4 border-l-blue-500 shadow-blue-100 shadow-lg',
          isDragging && 'opacity-50 border-dashed border-2'
        )}
        onClick={() => setIsEditDialogOpen(true)}
        {...listeners}
        {...attributes}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
              {localTask.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {/* Timer Button */}
            {localTask.status !== 'done' && (
              <Button 
                size="icon" 
                variant={isTimerActive ? "default" : "ghost"}
                className={`h-7 w-7 transition-all ${isTimerActive ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-50'}`}
                onClick={isTimerActive ? handleStopTimer : handleStartTimer}
                disabled={loading || (isRunning && !isTimerActive)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isTimerActive ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsTimeDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('tasks.logTime')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canMovePrevious && (
                <DropdownMenuItem onClick={() => handleStatusChange(
                  localTask.status === 'done' ? 'in_progress' : 'todo'
                )}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('tasks.moveTo')} {localTask.status === 'done' ? t('common.inProgress') : t('common.todo')}
                </DropdownMenuItem>
              )}
              {canMoveNext && (
                <DropdownMenuItem onClick={() => handleStatusChange(
                  localTask.status === 'todo' ? 'in_progress' : 'done'
                )}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('tasks.moveTo')} {localTask.status === 'todo' ? t('common.inProgress') : t('common.done')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {localTask.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {localTask.description}
          </p>
        )}

        {/* Progress Section */}
        <div className="mb-3 space-y-2">
          {/* Progress Bar */}
          <div title="Click anywhere on card to view task details">
            <ProgressBar value={localTask.progress} showPercentage size="sm" />
          </div>

          {/* Time Progress Indicator */}
          <div className="flex items-center justify-between">
            <TimeProgressIndicator
              estimatedDuration={localTask.estimated_duration}
              actualDuration={localTask.actual_duration}
              size="sm"
            />
            {localTask.estimated_duration && !localTask.actual_duration && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{localTask.estimated_duration}m</span>
              </div>
            )}
            {localTask.actual_duration > 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                isOverTime ? 'text-red-600' : 'text-blue-600'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{localTask.actual_duration}m</span>
                {isOverTime && <span className="text-red-500">⚠️</span>}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {localTask.tags && localTask.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {localTask.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${priorityColors[localTask.priority]} font-medium text-xs px-2 py-1`}>
              {t(`common.${localTask.priority}`)}
            </Badge>
          </div>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(localTask.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={localTask}
        userId={userId}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Add Manual Time Dialog */}
      <AddManualTimeDialog
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        taskId={localTask.id}
        taskTitle={localTask.title}
        userId={userId}
        onTimeAdded={handleTimeAdded}
      />
    </>
  )
}