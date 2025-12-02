'use client'

import { useState } from 'react'
import { ProjectProgressStats } from './ProjectProgressStats'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { MobileKanban } from '@/components/tasks/MobileKanban'

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

interface ProjectContentProps {
  projectId: string
  initialTasks: Task[]
  userId: string
  project?: Project
}

export function ProjectContent({ projectId, initialTasks, userId, project }: ProjectContentProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask])
  }

  const handleTasksCreated = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  return (
    <div className="space-y-4">
      <ProjectProgressStats tasks={tasks} />
      
      {/* Desktop Kanban */}
      <div className="hidden md:block">
        <KanbanBoard 
          projectId={projectId} 
          initialTasks={tasks} 
          userId={userId}
          project={project}
          onTaskCreated={handleTaskCreated}
          onTasksCreated={handleTasksCreated}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onTasksChange={setTasks}
        />
      </div>

      {/* Mobile Kanban */}
      <div className="md:hidden">
        <MobileKanban
          projectId={projectId}
          tasks={tasks}
          userId={userId}
          project={project}
          onTaskCreated={handleTaskCreated}
          onTasksCreated={handleTasksCreated}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      </div>
    </div>
  )
}

