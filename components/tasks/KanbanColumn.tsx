'use client'

import { TaskCard } from './TaskCard'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'

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

interface KanbanColumnProps {
  title: string
  status: 'todo' | 'in_progress' | 'done'
  tasks: Task[]
  count: number
  userId: string
  onTaskUpdated: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
}

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2
}

const statusColors = {
  todo: 'text-gray-500 bg-gray-50',
  in_progress: 'text-blue-500 bg-blue-50',
  done: 'text-green-500 bg-green-50'
}

export function KanbanColumn({ title, status, tasks, count, userId, onTaskUpdated, onTaskDeleted }: KanbanColumnProps) {
  const Icon = statusIcons[status]

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${statusColors[status]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3 flex-1">
        {tasks.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task}
              userId={userId}
              onTaskUpdated={onTaskUpdated}
              onTaskDeleted={onTaskDeleted}
            />
          ))
        )}
      </div>
    </div>
  )
}