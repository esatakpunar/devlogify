'use client'

import { TaskCard } from './TaskCard'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useState, useEffect } from 'react'

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
  const t = useTranslation()

  // Calculate average progress for this column
  const averageProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
    : 0

  // Animated progress value for smooth transitions
  const [animatedProgress, setAnimatedProgress] = useState(averageProgress)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(averageProgress)
    }, 50)
    return () => clearTimeout(timer)
  }, [averageProgress])

  // Get progress color based on value
  const getProgressColor = (progress: number) => {
    if (progress <= 30) {
      return {
        stroke: 'stroke-red-500',
        ring: 'ring-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-600 dark:text-red-400',
        glow: 'drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]'
      }
    } else if (progress <= 70) {
      return {
        stroke: 'stroke-amber-500',
        ring: 'ring-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-600 dark:text-amber-400',
        glow: 'drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]'
      }
    } else {
      return {
        stroke: 'stroke-emerald-500',
        ring: 'ring-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        glow: 'drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]'
      }
    }
  }

  const progressColors = getProgressColor(animatedProgress)
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - animatedProgress / 100)

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-25rem)]">
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
        {/* Progress indicator */}
        {tasks.length > 0 && (
          <div 
            className={cn(
              "relative group",
              "flex items-center justify-center",
              "w-10 h-10 rounded-full",
              progressColors.bg,
              "transition-all duration-300 ease-out",
              "hover:scale-110 hover:shadow-md"
            )}
            title={`Average progress: ${averageProgress}%`}
          >
            <svg 
              className="w-10 h-10 transform -rotate-90" 
              viewBox="0 0 36 36"
            >
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r={radius}
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                className="text-gray-200/60 dark:text-gray-700/60"
              />
              {/* Progress circle with smooth animation */}
              <circle
                cx="18"
                cy="18"
                r={radius}
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={cn(
                  progressColors.stroke,
                  "transition-all duration-500 ease-out",
                  progressColors.glow
                )}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-[10px] font-semibold leading-none",
                progressColors.text,
                "transition-colors duration-300"
              )}>
                {animatedProgress}%
              </span>
            </div>
            {/* Subtle ring effect on hover */}
            <div className={cn(
              "absolute inset-0 rounded-full",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-300",
              `ring-2 ${progressColors.ring}`,
              "ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
            )} />
          </div>
        )}
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
              {isOver ? t('kanban.dropTaskHere') || "Drop task here" : t('tasks.noTasks')}
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