'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Lock, Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'
import { KanbanColumn } from '@/components/tasks/KanbanColumn'
import { TaskCard } from '@/components/tasks/TaskCard'
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog'
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture'
import type { SharedLink } from '@/lib/supabase/queries/sharing'
import { exportToJSON, exportToCSV, downloadFile, prepareExportData } from '@/lib/utils/export'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Project {
  id: string
  title: string
  description: string | null
  color: string
  status: string
  created_at: string
}

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
  tags?: string[] | null
}

interface SharedProjectViewProps {
  project: Project
  tasks: Task[]
  shareLink: SharedLink
}

export function SharedProjectView({ project, tasks, shareLink }: SharedProjectViewProps) {
  const [downloading, setDownloading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const t = useTranslation()
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const doneTasks = tasks.filter(t => t.status === 'done')

  const statuses: Array<{ value: 'todo' | 'in_progress' | 'done'; label: string }> = [
    { value: 'todo', label: t('tasks.todo') || t('common.todo') || 'To Do' },
    { value: 'in_progress', label: t('tasks.inProgress') || t('common.inProgress') || 'In Progress' },
    { value: 'done', label: t('tasks.done') || t('common.done') || 'Done' },
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

  const handleExportJSON = () => {
    setDownloading(true)
    try {
      // Convert project and tasks to export format
      const projectForExport = {
        ...project,
        tasks: undefined, // Remove tasks from project object
      }
      const exportData = prepareExportData(
        [projectForExport as any],
        tasks as any,
        [],
        undefined,
        { includeProjects: true, includeTasks: true, includeNotes: false }
      )
      const json = exportToJSON(exportData)
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const filename = `${sanitizedTitle || 'project'}-${timestamp}.json`
      downloadFile(json, filename, 'application/json')
    } catch (error) {
      console.error('Failed to export JSON:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleExportCSV = () => {
    setDownloading(true)
    try {
      const csv = exportToCSV({ tasks: tasks as any, projects: [project as any] })
      const timestamp = new Date().toISOString().split('T')[0]
      const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const filename = `${sanitizedTitle || 'project'}-${timestamp}.csv`
      downloadFile(csv, filename, 'text/csv')
    } catch (error) {
      console.error('Failed to export CSV:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskDialogOpen(true)
  }

  const handleTaskDialogClose = () => {
    setIsTaskDialogOpen(false)
    setSelectedTask(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-xl sm:text-2xl font-bold dark:text-white break-words">{project.title}</h1>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs flex-shrink-0">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{t('sharing.readOnly')}</span>
                  <span className="sm:hidden">{t('sharing.readOnly')}</span>
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 break-words">
                  {project.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={downloading} className="w-full sm:w-auto text-xs sm:text-sm">
                  {downloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">{t('export.exporting')}</span>
                      <span className="sm:hidden">{t('export.exporting')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('export.download')}</span>
                      <span className="sm:hidden">{t('export.download')}</span>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuItem onClick={handleExportJSON} disabled={downloading} className="text-xs sm:text-sm">
                  <FileJson className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  {t('export.downloadAsJSON')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV} disabled={downloading} className="text-xs sm:text-sm">
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  {t('export.downloadAsCSV')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>

        {/* Desktop: Kanban Board (Read-Only) */}
        <div className="hidden md:grid md:grid-cols-3 gap-3 sm:gap-4">
          <KanbanColumn
            title={t('common.todo')}
            tasks={todoTasks}
            status="todo"
            count={todoTasks.length}
            projectId={project.id}
            userId=""
            companyId=""
            onTaskClick={handleTaskClick}
            readOnly
          />
          <KanbanColumn
            title={t('common.inProgress')}
            tasks={inProgressTasks}
            status="in_progress"
            count={inProgressTasks.length}
            projectId={project.id}
            userId=""
            companyId=""
            onTaskClick={handleTaskClick}
            readOnly
          />
          <KanbanColumn
            title={t('common.done')}
            tasks={doneTasks}
            status="done"
            count={doneTasks.length}
            projectId={project.id}
            userId=""
            companyId=""
            onTaskClick={handleTaskClick}
            readOnly
          />
        </div>

        {/* Mobile: Tabbed View (Read-Only) */}
        <div className="md:hidden">
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
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {t('tasks.noTasksInStatus') || 'No tasks in this status'}
                </p>
              </Card>
            ) : (
              <>
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userId=""
                    companyId=""
                    readOnly={true}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">
          <p>{t('sharing.readOnlyView', { count: shareLink.view_count || 0 })}</p>
        </div>
      </div>

      {/* Task Dialog (Read-Only) */}
      {selectedTask && (
        <EditTaskDialog
          open={isTaskDialogOpen}
          onOpenChange={handleTaskDialogClose}
          task={selectedTask}
          onTaskUpdated={() => {}}
          readOnly={true}
        />
      )}
    </div>
  )
}
