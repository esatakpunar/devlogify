'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Sparkles } from 'lucide-react'
import { CreateTaskDialog } from './CreateTaskDialog'
import { AICreateTasksDialog } from './AICreateTasksDialog'
import { TaskCard } from './TaskCard'
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'

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

interface MobileKanbanProps {
  projectId: string
  tasks: Task[]
  userId: string
  project?: Project
  onTaskCreated?: (task: Task) => void
  onTasksCreated?: (tasks: Task[]) => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

export function MobileKanban({
  projectId,
  tasks,
  userId,
  project,
  onTaskCreated,
  onTasksCreated,
  onTaskUpdated,
  onTaskDeleted,
}: MobileKanbanProps) {
  const { isPremium } = usePremium(userId)
  const [selectedStatus, setSelectedStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAICreateDialogOpen, setIsAICreateDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const t = useTranslation()

  const statuses: Array<{ value: 'todo' | 'in_progress' | 'done'; label: string }> = [
    { value: 'todo', label: t('tasks.todo') || 'To Do' },
    { value: 'in_progress', label: t('tasks.inProgress') || 'In Progress' },
    { value: 'done', label: t('tasks.done') || 'Done' },
  ]

  const filteredTasks = tasks.filter(t => t.status === selectedStatus)

  const getStatusButtonClass = (status: 'todo' | 'in_progress' | 'done', isSelected: boolean) => {
    if (isSelected) {
      switch (status) {
        case 'todo':
          return 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
        case 'in_progress':
          return 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
        case 'done':
          return 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
      }
    } else {
      switch (status) {
        case 'todo':
          return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
        case 'in_progress':
          return 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20'
        case 'done':
          return 'bg-white text-green-700 border-green-300 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20'
      }
    }
  }

  const handleSwipeLeft = () => {
    const currentIndex = statuses.findIndex(s => s.value === selectedStatus)
    if (currentIndex < statuses.length - 1) {
      setSelectedStatus(statuses[currentIndex + 1].value)
    }
  }

  const handleSwipeRight = () => {
    const currentIndex = statuses.findIndex(s => s.value === selectedStatus)
    if (currentIndex > 0) {
      setSelectedStatus(statuses[currentIndex - 1].value)
    }
  }

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  })

  const handleTasksCreated = (newTasks: Task[]) => {
    if (onTasksCreated) {
      onTasksCreated(newTasks)
    } else {
      // Fallback to individual task creation if onTasksCreated is not provided
      newTasks.forEach(task => onTaskCreated?.(task))
    }
  }

  return (
    <div className="md:hidden">
      {/* Action Buttons */}
      <div className="mb-3 flex gap-2">
        {isPremium ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAICreateDialogOpen(true)}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('kanban.createTasksWithAI')}</span>
            <span className="sm:hidden">AI</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUpgradeDialogOpen(true)}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('kanban.createTasksWithAI')}</span>
            <span className="sm:hidden">AI</span>
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('tasks.newTask')}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {statuses.map((status) => {
          const isSelected = selectedStatus === status.value
          const taskCount = tasks.filter(t => t.status === status.value).length
          return (
            <Button
              key={status.value}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status.value)}
              className={`flex flex-col items-center justify-center gap-1 h-auto py-2.5 px-2 border transition-colors ${getStatusButtonClass(status.value, isSelected)}`}
            >
              <span className="text-xs font-medium leading-tight line-clamp-1">{status.label}</span>
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-1.5 py-0.5 h-4 min-w-[20px] flex items-center justify-center ${
                  isSelected 
                    ? 'bg-white/20 text-white dark:bg-white/10 dark:text-white' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {taskCount}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Tasks List */}
      <div {...swipeHandlers} className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
              {t('tasks.noTasksInStatus')}
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('tasks.createTask') || 'Create Task'}
            </Button>
          </Card>
        ) : (
          <>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                userId={userId}
                onTaskUpdated={onTaskUpdated}
                onTaskDeleted={onTaskDeleted}
                readOnly={false}
              />
            ))}
          </>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        userId={userId}
        project={project}
        onTaskCreated={(task) => {
          onTaskCreated?.(task)
          setIsCreateDialogOpen(false)
        }}
      />

      {/* AI Create Tasks Dialog */}
      <AICreateTasksDialog
        open={isAICreateDialogOpen}
        onOpenChange={setIsAICreateDialogOpen}
        projects={project ? [project] : [{ id: projectId, title: 'Current Project', color: '#3b82f6' }]}
        userId={userId}
        onTasksCreated={handleTasksCreated}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="AI Task Features"
      />
    </div>
  )
}

