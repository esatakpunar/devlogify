'use client'

import { ProgressBar } from '@/components/ui/progress-bar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
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
}

interface ProjectProgressStatsProps {
  tasks: Task[]
}

export function ProjectProgressStats({ tasks }: ProjectProgressStatsProps) {
  const t = useTranslation()
  
  // Calculate overall project progress based on task status
  // done: 100%, in_progress: 50%, todo: 0%
  const overallProgress = tasks.length > 0 
    ? Math.round(
        tasks.reduce((sum, task) => {
          if (task.status === 'done') return sum + 100
          if (task.status === 'in_progress') return sum + 50
          return sum + 0
        }, 0) / tasks.length
      )
    : 0

  // Calculate status distribution
  const statusDistribution = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  const completedTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Overall Progress */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('projects.overallProgress')}</span>
            <span className="text-lg font-semibold text-foreground">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} size="sm" />
          <div className="text-xs text-muted-foreground mt-1.5">
            {completedTasks} / {tasks.length} {t('projects.tasks') || 'tasks'}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-12 bg-border" />

        {/* Status Distribution */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs text-muted-foreground">{t('common.todo')}</span>
            <Badge variant="outline" className="text-xs font-medium min-w-[2rem] justify-center">
              {statusDistribution.todo}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">{t('common.inProgress')}</span>
            <Badge variant="outline" className="text-xs font-medium min-w-[2rem] justify-center bg-blue-50 text-blue-700 border-blue-200">
              {statusDistribution.in_progress}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">{t('common.done')}</span>
            <Badge variant="outline" className="text-xs font-medium min-w-[2rem] justify-center bg-green-50 text-green-700 border-green-200">
              {statusDistribution.done}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
