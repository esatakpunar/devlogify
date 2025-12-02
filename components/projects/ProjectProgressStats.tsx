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
    <div className="rounded-lg border bg-card p-3 sm:p-3 md:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6">
        {/* Overall Progress */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-xs md:text-sm font-medium text-muted-foreground">{t('projects.overallProgress')}</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold text-foreground">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} size="sm" />
          <div className="text-[10px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
            {completedTasks} / {tasks.length} {t('projects.tasks') || 'tasks'}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 md:h-10 bg-border flex-shrink-0" />

        {/* Status Distribution */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 min-w-0 flex-1 sm:flex-initial">
              <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-[10px] md:text-xs text-muted-foreground truncate">{t('common.todo')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-[10px] md:text-xs font-medium min-w-[1.75rem] sm:min-w-[1.75rem] md:min-w-[2rem] justify-center flex-shrink-0">
              {statusDistribution.todo}
            </Badge>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 min-w-0 flex-1 sm:flex-initial">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-[10px] sm:text-[10px] md:text-xs text-muted-foreground truncate">{t('common.inProgress')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-[10px] md:text-xs font-medium min-w-[1.75rem] sm:min-w-[1.75rem] md:min-w-[2rem] justify-center bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex-shrink-0">
              {statusDistribution.in_progress}
            </Badge>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 min-w-0 flex-1 sm:flex-initial">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[10px] sm:text-[10px] md:text-xs text-muted-foreground truncate">{t('common.done')}</span>
            </div>
            <Badge variant="outline" className="text-[10px] sm:text-[10px] md:text-xs font-medium min-w-[1.75rem] sm:min-w-[1.75rem] md:min-w-[2rem] justify-center bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 flex-shrink-0">
              {statusDistribution.done}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
