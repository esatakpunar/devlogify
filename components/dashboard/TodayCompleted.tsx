'use client'

import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { TaskWithProject } from '@/lib/supabase/queries/tasks'

interface Task {
  id: string
  title: string
  actual_duration: number
  completed_at: string | null
  project: {
    id: string
    title: string
    color: string
  }
}

interface TodayCompletedProps {
  tasks: Task[]
}

export function TodayCompleted({ tasks }: TodayCompletedProps) {
  const t = useTranslation()
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatCompletedTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('dashboard.todaysCompleted')}</h3>
        <div className="text-center py-6 text-gray-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{t('dashboard.noTasksCompletedToday')}</p>
          <p className="text-xs">{t('dashboard.keepWorking')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{t('dashboard.todaysCompleted')}</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <Link
                  href={`/projects/${task.project.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                >
                  {task.title}
                </Link>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: task.project.color + '20', color: task.project.color }}
                >
                  {task.project.title}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(task.actual_duration)}
                </span>
                <span>•</span>
                {task.completed_at && (
                  <span>{t('dashboard.completedAt')} {formatCompletedTime(task.completed_at)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {tasks.length >= 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/timeline">
            <Button variant="ghost" size="sm" className="w-full">
              {t('dashboard.viewTimeline')}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
