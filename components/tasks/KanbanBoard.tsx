'use client'

import { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { CreateTaskDialog } from './CreateTaskDialog'
import { AICreateTasksDialog } from './AICreateTasksDialog'
import { TaskGroupingButton } from './TaskGroupingButton'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
} from '@dnd-kit/core'
import { updateTaskStatus, updateTasksOrder } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
import { toast } from 'sonner'

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
}

export function KanbanBoard({ projectId, initialTasks, userId, project }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAICreateDialogOpen, setIsAICreateDialogOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks = tasks.filter(t => t.status === 'done')

  const handleTaskCreated = (newTask: Task) => {
    setTasks([...tasks, newTask])
  }

  const handleTasksCreated = (newTasks: Task[]) => {
    setTasks([...tasks, ...newTasks])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId))
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
        setTasks(tasks.map(task => {
          if (task.id === activeId) {
            return { ...task, status: overTask.status as 'todo' | 'in_progress' | 'done' }
          }
          return task
        }))
      }
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
        const updatedTask = { ...activeTask, status: newStatus }
        setTasks(tasks.map(t => t.id === activeId ? updatedTask : t))

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

        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`)
      } catch (error) {
        console.error('Failed to update task status:', error)
        // Revert optimistic update
        setTasks(tasks.map(t => t.id === activeId ? activeTask : t))
        toast.error('Failed to move task')
      }
    } else {
      // Same-column reordering is disabled to avoid multiple database requests
      // Only cross-column movement is supported
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <span className="text-sm text-gray-500">
              {tasks.length} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAICreateDialogOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Create Tasks
            </Button>
            <TaskGroupingButton 
              projectId={projectId} 
              userId={userId}
              onTasksUpdated={() => {
                // Refresh tasks by reloading the page data
                window.location.reload()
              }}
            />
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={todoTasks}
            count={todoTasks.length}
            userId={userId}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
          <KanbanColumn
            title="In Progress"
            status="in_progress"
            tasks={inProgressTasks}
            count={inProgressTasks.length}
            userId={userId}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
          <KanbanColumn
            title="Done"
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
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="border-2 border-dashed rounded-lg p-4 bg-white shadow-lg opacity-90">
            <h4 className="font-semibold text-sm">{activeTask.title}</h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}