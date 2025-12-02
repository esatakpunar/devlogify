'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KanbanColumn } from './KanbanColumn'
import { CreateTaskDialog } from './CreateTaskDialog'
import { AICreateTasksDialog } from './AICreateTasksDialog'
import { TaskGroupingButton } from './TaskGroupingButton'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCenter,
} from '@dnd-kit/core'
import { updateTaskStatus, updateTasksOrder } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
import { toast } from 'sonner'
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

interface Project {
  id: string
  title: string
  color: string
}

interface KanbanBoardProps {
  projectId: string
  initialTasks: Task[]
  userId: string
  project?: Project
  onTaskCreated?: (task: Task) => void
  onTasksCreated?: (tasks: Task[]) => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  onTasksChange?: (tasks: Task[]) => void
}

export function KanbanBoard({ 
  projectId, 
  initialTasks, 
  userId, 
  project,
  onTaskCreated,
  onTasksCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTasksChange
}: KanbanBoardProps) {
  const router = useRouter()
  const { isPremium } = usePremium(userId)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAICreateDialogOpen, setIsAICreateDialogOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const t = useTranslation()

  // Sync with parent when initialTasks change
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12,
        delay: 100,
      },
    })
  )

  const todoTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => a.order_index - b.order_index)
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').sort((a, b) => a.order_index - b.order_index)
  const doneTasks = tasks.filter(t => t.status === 'done').sort((a, b) => a.order_index - b.order_index)

  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks)
    onTasksChange?.(newTasks)
  }

  const handleTaskCreated = (newTask: Task) => {
    const updatedTasks = [...tasks, newTask]
    updateTasks(updatedTasks)
    onTaskCreated?.(newTask)
  }

  const handleTasksCreated = (newTasks: Task[]) => {
    const updatedTasks = [...tasks, ...newTasks]
    updateTasks(updatedTasks)
    onTasksCreated?.(newTasks)
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    updateTasks(updatedTasks)
    onTaskUpdated?.(updatedTask)
  }

  const handleTaskDeleted = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId)
    updateTasks(updatedTasks)
    onTaskDeleted?.(taskId)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // If dropping over a task (not a column)
    if (overId !== 'todo' && overId !== 'in_progress' && overId !== 'done') {
      const overTask = tasks.find(t => t.id === overId)
      if (!overTask) return

      if (activeTask.status !== overTask.status) {
        // Moving to different column
        const updatedTasks = tasks.map(task => {
          if (task.id === activeId) {
            const newStatus = overTask.status as 'todo' | 'in_progress' | 'done'
            return { 
              ...task, 
              status: newStatus,
              ...(newStatus === 'done' ? { progress: 100 } : {})
            }
          }
          return task
        })
        updateTasks(updatedTasks)
      }
      // Same-column reordering is disabled to avoid multiple database requests
      // Only cross-column movement is supported
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // If dropping over a column
    if (overId === 'todo' || overId === 'in_progress' || overId === 'done') {
      const newStatus = overId as 'todo' | 'in_progress' | 'done'
      
      if (activeTask.status === newStatus) return

      try {
        // Optimistically update the UI
        const updatedTask = { 
          ...activeTask, 
          status: newStatus,
          ...(newStatus === 'done' ? { progress: 100 } : {})
        }
        const updatedTasks = tasks.map(t => t.id === activeId ? updatedTask : t)
        updateTasks(updatedTasks)

        // Update in database
        await updateTaskStatus(activeId, newStatus)
        
        // Log activity
        await logActivity(
          userId,
          activeTask.project_id,
          activeTask.id,
          newStatus === 'done' ? 'task_completed' : 'task_status_changed',
          { 
            old_status: activeTask.status,
            new_status: newStatus,
            task_title: activeTask.title
          }
        )

        const statusText = newStatus === 'todo' ? t('kanban.todo') : 
                          newStatus === 'in_progress' ? t('kanban.inProgress') : 
                          t('kanban.done')
        toast.success(t('tasks.taskMarkedAsComplete'))
      } catch (error) {
        console.error('Failed to update task status:', error)
        // Revert optimistic update
        const revertedTasks = tasks.map(t => t.id === activeId ? activeTask : t)
        updateTasks(revertedTasks)
        toast.error(t('tasks.failedToUpdateTask'))
      }
    } else {
      // Dropping over another task - only handle cross-column movement
      const overTask = tasks.find(t => t.id === overId)
      if (!overTask) return

      if (activeTask.status !== overTask.status) {
        // Cross-column movement
        const newStatus = overTask.status as 'todo' | 'in_progress' | 'done'
        try {
          const updatedTask = { 
            ...activeTask, 
            status: newStatus,
            ...(newStatus === 'done' ? { progress: 100 } : {})
          }
          const updatedTasks = tasks.map(t => t.id === activeId ? updatedTask : t)
          updateTasks(updatedTasks)

          await updateTaskStatus(activeId, newStatus)
          
          await logActivity(
            userId,
            activeTask.project_id,
            activeTask.id,
            newStatus === 'done' ? 'task_completed' : 'task_status_changed',
            { 
              old_status: activeTask.status,
              new_status: newStatus,
              task_title: activeTask.title
            }
          )

          toast.success(t('tasks.taskMarkedAsComplete'))
        } catch (error) {
          console.error('Failed to update task status:', error)
          const revertedTasks = tasks.map(t => t.id === activeId ? activeTask : t)
          updateTasks(revertedTasks)
          toast.error(t('tasks.failedToUpdateTask'))
        }
      }
      // Same-column reordering is disabled to avoid multiple database requests
      // Only cross-column movement is supported
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {isPremium ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAICreateDialogOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                <Sparkles className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('kanban.createTasksWithAI')}</span>
              </Button>
              <TaskGroupingButton 
                projectId={projectId} 
                userId={userId}
                onTasksUpdated={() => {
                  // Refresh tasks by refreshing the page data
                  router.refresh()
                }}
              />
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpgradeDialogOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                <Sparkles className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('kanban.createTasksWithAI')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpgradeDialogOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                <Sparkles className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('kanban.groupTasks')}</span>
              </Button>
            </>
          )}
          <Button 
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            {t('tasks.newTask')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KanbanColumn
            title={t('kanban.todo')}
            status="todo"
            tasks={todoTasks}
            count={todoTasks.length}
            userId={userId}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
          <KanbanColumn
            title={t('kanban.inProgress')}
            status="in_progress"
            tasks={inProgressTasks}
            count={inProgressTasks.length}
            userId={userId}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
          <KanbanColumn
            title={t('kanban.done')}
            status="done"
            tasks={doneTasks}
            count={doneTasks.length}
            userId={userId}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        </div>

        <CreateTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          projectId={projectId}
          userId={userId}
          onTaskCreated={handleTaskCreated}
        />

        <AICreateTasksDialog
          open={isAICreateDialogOpen}
          onOpenChange={setIsAICreateDialogOpen}
          projects={project ? [project] : [{ id: projectId, title: 'Current Project', color: '#3b82f6' }]}
          userId={userId}
          onTasksCreated={handleTasksCreated}
        />

        <UpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          feature="AI Task Features"
        />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-lg opacity-95 cursor-grabbing">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm dark:text-gray-200">{activeTask.title}</h4>
            </div>
            {activeTask.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                {activeTask.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
              {activeTask.actual_duration > 0 && (
                <span>{activeTask.actual_duration}m</span>
              )}
              {activeTask.priority && (
                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                  {t(`common.${activeTask.priority}`)}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}