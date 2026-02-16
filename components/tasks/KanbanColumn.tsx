'use client'

import { TaskCard } from './TaskCard'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { motion, AnimatePresence } from 'framer-motion'

type Task = {
  id: string
  task_number: number
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
  company_id?: string | null
}

interface KanbanColumnProps {
  title: string
  status: 'todo' | 'in_progress' | 'done'
  tasks: Task[]
  count?: number
  projectId?: string
  userId: string
  companyId: string
  projectOptions?: { id: string; title: string; color: string }[]
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  onTaskClick?: (task: Task) => void
  readOnly?: boolean
}

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2
}

const statusColors = {
  todo: 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/50',
  in_progress: 'text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  done: 'text-green-500 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
}

export function KanbanColumn({
  title,
  status,
  tasks,
  count,
  projectId,
  userId,
  companyId,
  projectOptions,
  onTaskUpdated,
  onTaskDeleted,
  onTaskClick,
  readOnly = false
}: KanbanColumnProps) {
  const Icon = statusIcons[status]
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    disabled: readOnly,
  })
  const t = useTranslation()
  
  const taskCount = count !== undefined ? count : tasks.length

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-18rem)]">
      <div className="flex items-center gap-2 mb-4 px-2 flex-shrink-0">
        <div className={`p-1.5 rounded-lg ${statusColors[status]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold dark:text-gray-200">{title}</h3>
        <span className="text-sm text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {taskCount}
        </span>
      </div>

      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 transition-all duration-200",
          isOver && "bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-lg shadow-inner"
        )}
      >
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center transition-all duration-200",
              isOver && "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 scale-105"
            )}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isOver ? t('kanban.dropTaskHere') || "Drop task here" : t('tasks.noTasks')}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
                className="relative"
              >
                <TaskCard
                  task={task}
                  userId={userId}
                  companyId={companyId}
                  projectOptions={projectOptions}
                  onTaskUpdated={onTaskUpdated}
                  onTaskDeleted={onTaskDeleted}
                  onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                  readOnly={readOnly}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
