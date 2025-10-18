'use client'

import { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { CreateTaskDialog } from './CreateTaskDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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

interface KanbanBoardProps {
  projectId: string
  initialTasks: Task[]
  userId: string
}

export function KanbanBoard({ projectId, initialTasks, userId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks = tasks.filter(t => t.status === 'done')

  const handleTaskCreated = (newTask: Task) => {
    setTasks([...tasks, newTask])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <span className="text-sm text-gray-500">
            {tasks.length} total
          </span>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
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
    </div>
  )
}