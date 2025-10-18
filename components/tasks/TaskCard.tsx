'use client'

import { useState } from 'react'
import { Clock, MoreVertical, Play, Square, ArrowRight, ArrowLeft, Edit, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { updateTaskStatus, deleteTask } from '@/lib/supabase/queries/tasks'
import { useTimer } from '@/lib/hooks/useTimer'
import { logActivity } from '@/lib/utils/activityLogger'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EditTaskDialog } from './EditTaskDialog'
import { AddManualTimeDialog } from './AddManualTimeDialog'

type Task = {
  id: string
  project_id: string  // EKLE
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimated_duration: number | null
  actual_duration: number
  created_at: string
}

interface TaskCardProps {
  task: Task
  userId: string
  onTaskUpdated: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
}

export function TaskCard({ task, userId, onTaskUpdated, onTaskDeleted }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [localTask, setLocalTask] = useState(task)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false)
  const { taskId, isRunning, elapsed, startTimer, stopTimer, formatTime } = useTimer()
  const supabase = createClient()

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
    if (!confirm('Are you sure you want to delete this task?')) return
    
    setLoading(true)
    try {
      await deleteTask(task.id)
      onTaskDeleted(task.id)
      toast.success('Task deleted')
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTimer = async () => {
    if (isRunning) {
      toast.error('Please stop the current timer first')
      return
    }

    try {
      await startTimer(task.id, task.title, userId)
      if (task.status === 'todo') {
        await handleStatusChange('in_progress')
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
      toast.error('Failed to start timer')
    }
  }

  const handleStopTimer = async () => {
    setLoading(true)
    try {
      await stopTimer(userId)
      
      const { data: updatedTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task.id)
        .single()

      if (updatedTask) {
        setLocalTask(updatedTask)
        onTaskUpdated(updatedTask)
        
        const durationMinutes = Math.floor(elapsed / 60)
        toast.success('Timer stopped', {
          description: `Logged ${durationMinutes} minutes to "${task.title}"`,
        })
      }
    } catch (error) {
      console.error('Failed to stop timer:', error)
      toast.error('Failed to stop timer')
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
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task.id)
      .single()

    if (updatedTask) {
      setLocalTask(updatedTask)
      onTaskUpdated(updatedTask)
    }
  }

  const canMovePrevious = localTask.status !== 'todo'
  const canMoveNext = localTask.status !== 'done'

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm flex-1 line-clamp-2">
            {localTask.title}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" disabled={loading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsTimeDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Log Time
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canMovePrevious && (
                <DropdownMenuItem onClick={() => handleStatusChange(
                  localTask.status === 'done' ? 'in_progress' : 'todo'
                )}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Move to {localTask.status === 'done' ? 'In Progress' : 'To Do'}
                </DropdownMenuItem>
              )}
              {canMoveNext && (
                <DropdownMenuItem onClick={() => handleStatusChange(
                  localTask.status === 'todo' ? 'in_progress' : 'done'
                )}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Move to {localTask.status === 'todo' ? 'In Progress' : 'Done'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {localTask.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {localTask.description}
          </p>
        )}

        {/* Timer Section */}
        {isTimerActive && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm font-mono font-medium text-blue-900">
                  {formatTime(elapsed)}
                </span>
              </div>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleStopTimer}
                className="h-7"
                disabled={loading}
              >
                <Square className="w-3 h-3 mr-1" />
                {loading ? 'Stopping...' : 'Stop'}
              </Button>
            </div>
          </div>
        )}

        {/* Timer Button */}
        {localTask.status !== 'done' && !isTimerActive && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full mb-3"
            onClick={handleStartTimer}
            disabled={loading || isRunning}
          >
            <Play className="w-3 h-3 mr-2" />
            {isRunning ? 'Another timer active' : 'Start Timer'}
          </Button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={priorityColors[localTask.priority]}>
              {localTask.priority}
            </Badge>
            {localTask.estimated_duration && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{localTask.estimated_duration}m</span>
              </div>
            )}
            {localTask.actual_duration > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Clock className="w-3 h-3" />
                <span>{localTask.actual_duration}m</span>
              </div>
            )}
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