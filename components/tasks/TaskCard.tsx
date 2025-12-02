'use client'

import { useState, useEffect } from 'react'
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
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  onClick?: () => void
  readOnly?: boolean
}

const priorityColors = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
}

const statusStyles = {
  todo: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
  in_progress: 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-900/20',
  done: 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/20'
}

export function TaskCard({ task, userId, onTaskUpdated, onTaskDeleted, onClick, readOnly = false }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [timerLoading, setTimerLoading] = useState(false)
  const [localTask, setLocalTask] = useState(task)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)
  const [hasMoved, setHasMoved] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { taskId, isRunning, elapsed, startTimer, stopTimer, formatTime } = useTimer()
  const t = useTranslation()

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: readOnly || isMobile,
  })

  const isTimerActive = isRunning && taskId === task.id

  const handleStatusChange = async (newStatus: 'todo' | 'in_progress' | 'done') => {
    if (readOnly || !onTaskUpdated) return
    
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
    if (readOnly || !onTaskDeleted) return
    
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

  const handleStartTimer = async (e: React.MouseEvent) => {
    if (readOnly) return
    
    e.stopPropagation()
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

  const handleStopTimer = async (e: React.MouseEvent) => {
    if (readOnly) return
    
    e.stopPropagation()
    setTimerLoading(true)
    try {
      await stopTimer(userId)

      const updatedTask = await getTask(task.id)

      setLocalTask(updatedTask)
      onTaskUpdated?.(updatedTask)

      const durationMinutes = Math.floor(elapsed / 60)
      toast.success(t('tasks.timerStopped'), {
        description: t('tasks.loggedMinutes', { minutes: durationMinutes, title: task.title }),
      })
    } catch (error) {
      console.error('Failed to stop timer:', error)
      toast.error(t('tasks.failedToStopTimer'))
    } finally {
      setTimerLoading(false)
    }
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setLocalTask(updatedTask)
    onTaskUpdated?.(updatedTask)
  }

  const handleTimeAdded = async (minutes: number) => {
    if (readOnly) return
    
    // Task'ı yeniden çek
    const updatedTask = await getTask(task.id)
    setLocalTask(updatedTask)
    onTaskUpdated?.(updatedTask)
  }

  const canMovePrevious = localTask.status !== 'todo'
  const canMoveNext = localTask.status !== 'done'
  
  const isOverTime = localTask.estimated_duration && localTask.actual_duration > localTask.estimated_duration

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  useEffect(() => {
    // Reset hasMoved when dragging ends
    if (!isDragging && hasMoved) {
      const timer = setTimeout(() => {
        setHasMoved(false)
        setMouseDownPos(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isDragging, hasMoved])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Store mouse down position to detect drag vs click
    setMouseDownPos({ x: e.clientX, y: e.clientY })
    setHasMoved(false)
    
    // Apply drag listeners if not read-only and not clicking on interactive elements
    const target = e.target as HTMLElement
    if (!readOnly && !target.closest('button') && !target.closest('[role="menuitem"]')) {
      // Use a small delay to allow click to register first
      const timer = setTimeout(() => {
        if (listeners.onPointerDown && !hasMoved) {
          listeners.onPointerDown(e as any)
        }
      }, 10)
      
      // Clear timer if component unmounts
      return () => clearTimeout(timer)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Track if mouse moved (indicating a drag)
    if (mouseDownPos) {
      const deltaX = Math.abs(e.clientX - mouseDownPos.x)
      const deltaY = Math.abs(e.clientY - mouseDownPos.y)
      if (deltaX > 5 || deltaY > 5) {
        setHasMoved(true)
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Don't open modal if this was a drag
    if (hasMoved || isDragging) {
      setMouseDownPos(null)
      setHasMoved(false)
      return
    }

    // Don't open modal if clicking on buttons or dropdown
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="menu"]')
    ) {
      setMouseDownPos(null)
      return
    }

    // Small delay to ensure drag detection is complete
    setTimeout(() => {
      if (!hasMoved && !isDragging) {
        // If onClick prop is provided, use it, otherwise open edit dialog
        if (onClick) {
          onClick()
        } else {
          setIsEditDialogOpen(true)
        }
      }
      setMouseDownPos(null)
      setHasMoved(false)
    }, 50)
  }

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        className={cn(
          "border rounded-lg p-3 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 group",
          statusStyles[localTask.status],
          isTimerActive && 'border-l-4 border-l-blue-500 shadow-blue-100 dark:shadow-blue-900/50 shadow-md',
          isDragging && 'opacity-50 border-dashed border-2',
          !readOnly && 'cursor-pointer'
        )}
        onMouseDown={!isMobile ? handleMouseDown : undefined}
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseUp={!isMobile ? handleMouseUp : undefined}
        onClick={(e) => {
          e.stopPropagation()
          
          // Don't open modal if clicking on buttons or dropdown
          const target = e.target as HTMLElement
          if (
            target.closest('button') ||
            target.closest('[role="menuitem"]') ||
            target.closest('[role="menu"]')
          ) {
            return
          }
          
          // On mobile, always open dialog immediately (no drag detection needed)
          if (isMobile) {
            e.preventDefault()
            if (onClick) {
              onClick()
            } else {
              setIsEditDialogOpen(true)
            }
            return
          }
          
          // On desktop, check if it was a drag
          if (!hasMoved && !isDragging) {
            if (onClick) {
              onClick()
            } else {
              setIsEditDialogOpen(true)
            }
          }
        }}
        {...(readOnly || isMobile ? {} : { ...attributes, ...listeners })}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 dark:text-gray-200 transition-colors">
              {localTask.title}
            </h4>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {/* Timer Button */}
              {localTask.status !== 'done' && (
                <Button 
                  size="icon" 
                  variant={isTimerActive ? "default" : "ghost"}
                  className={`h-6 w-6 transition-all ${isTimerActive ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isTimerActive) {
                      handleStopTimer(e)
                    } else {
                      handleStartTimer(e)
                    }
                  }}
                  disabled={timerLoading || (isRunning && !isTimerActive)}
                >
                  {timerLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isTimerActive ? (
                    <Square className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                setIsTimeDialogOpen(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('tasks.logTime')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canMovePrevious && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(
                    localTask.status === 'done' ? 'in_progress' : 'todo'
                  )
                }}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('tasks.moveTo')} {localTask.status === 'done' ? t('common.inProgress') : t('common.todo')}
                </DropdownMenuItem>
              )}
              {canMoveNext && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(
                    localTask.status === 'todo' ? 'in_progress' : 'done'
                  )
                }}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('tasks.moveTo')} {localTask.status === 'todo' ? t('common.inProgress') : t('common.done')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }} className="text-red-600">
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </div>

        {/* Description */}
        {localTask.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1 leading-snug">
            {localTask.description}
          </p>
        )}

        {/* Progress Bar - Only show if progress > 0 */}
        {localTask.progress > 0 && (
          <div className="mb-2" title="Click anywhere on card to view task details">
            <ProgressBar value={localTask.progress} showPercentage size="sm" />
          </div>
        )}

        {/* Footer - Combined: Time, Priority, Tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Time Info */}
            {localTask.actual_duration > 0 ? (
              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                isOverTime ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{localTask.actual_duration}m</span>
                {isOverTime && <span className="ml-0.5">⚠️</span>}
              </div>
            ) : localTask.estimated_duration ? (
              <div className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{localTask.estimated_duration}m</span>
              </div>
            ) : null}
            
            {/* Priority */}
            {(localTask.actual_duration > 0 || localTask.estimated_duration) && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
            <Badge variant="outline" className={`${priorityColors[localTask.priority]} font-medium text-[10px] px-1.5 py-0.5 h-5`}>
              {t(`common.${localTask.priority}`)}
            </Badge>
            
            {/* Tags */}
            {localTask.tags && localTask.tags.length > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {localTask.tags.slice(0, 4).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 dark:bg-gray-700 dark:text-gray-300">
                      <Tag className="w-2.5 h-2.5 mr-0.5" />
                      {tag}
                    </Badge>
                  ))}
                  {localTask.tags.length > 4 && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">+{localTask.tags.length - 4}</span>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Created Date */}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(localTask.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={localTask}
        onTaskUpdated={handleTaskUpdated}
        readOnly={readOnly}
      />

      {/* Add Manual Time Dialog - Only show if not read-only */}
      {!readOnly && (
        <AddManualTimeDialog
          open={isTimeDialogOpen}
          onOpenChange={setIsTimeDialogOpen}
          taskId={localTask.id}
          taskTitle={localTask.title}
          userId={userId}
          onTimeAdded={handleTimeAdded}
        />
      )}
    </>
  )
}