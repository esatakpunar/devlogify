'use client'

import { TaskCard } from './TaskCard'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

type Task = {
  id: string
  project_id: string  // EKLE
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimated_duration: number | null
  actual_duration: number
  order_index: number
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
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  })

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-18rem)]">
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
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

      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors",
          isOver && "bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg"
        )}
      >
        {tasks.length === 0 ? (
          <div className={cn(
            "border-2 border-dashed border-gray-200 rounded-lg p-8 text-center transition-colors",
            isOver && "border-blue-300 bg-blue-50"
          )}>
            <p className="text-sm text-gray-500">
              {isOver ? "Drop task here" : "No tasks"}
            </p>
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