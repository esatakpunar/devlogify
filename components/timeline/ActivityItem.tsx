'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Edit, 
  FolderKanban,
  StickyNote,
  ArrowRight
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Activity {
  id: string
  action_type: string
  created_at: string
  metadata: any
  project?: {
    id: string
    title: string
    color: string
  } | null
  task?: {
    id: string
    title: string
  } | null
}

interface ActivityItemProps {
  activity: Activity
}

const activityIcons = {
  task_created: Plus,
  task_completed: CheckCircle2,
  task_status_changed: ArrowRight,
  time_logged: Clock,
  project_created: FolderKanban,
  note_created: StickyNote,
}

const activityColors = {
  task_created: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  task_completed: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  task_status_changed: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  time_logged: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  project_created: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  note_created: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const t = useTranslation()
  const Icon = activityIcons[activity.action_type as keyof typeof activityIcons] || Clock
  const colorClass = activityColors[activity.action_type as keyof typeof activityColors] || 'bg-gray-50 text-gray-600'

  const getActivityText = () => {
    switch (activity.action_type) {
      case 'task_created':
        return (
          <>
            {t('timeline.createdTask')}{' '}
            {activity.task && activity.project ? (
              <Link 
                href={`/projects/${activity.project.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {activity.task.title}
              </Link>
            ) : (
              <span className="font-medium dark:text-gray-200">{activity.task?.title}</span>
            )}
          </>
        )
      case 'task_completed':
        return (
          <>
            {t('timeline.completedTask')}{' '}
            <span className="font-medium dark:text-gray-200">{activity.task?.title}</span>
          </>
        )
      case 'task_status_changed':
        return (
          <>
            {t('timeline.moved')}{' '}
            <span className="font-medium dark:text-gray-200">{activity.task?.title}</span>
            {' '}{t('timeline.to')}{' '}
            <span className="font-medium dark:text-gray-200">{activity.metadata?.new_status || t('timeline.unknown')}</span>
          </>
        )
      case 'time_logged':
        const minutes = activity.metadata?.duration || 0
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return (
          <>
            {t('timeline.logged')}{' '}
            <span className="font-medium">
              {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
            </span>
            {activity.task && (
              <>
                {' '}{t('timeline.on')}{' '}
                <span className="font-medium dark:text-gray-200">{activity.task.title}</span>
              </>
            )}
          </>
        )
      case 'project_created':
        return (
          <>
            {t('timeline.createdProject')}{' '}
            {activity.project ? (
              <Link 
                href={`/projects/${activity.project.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {activity.project.title}
              </Link>
            ) : (
              <span className="font-medium dark:text-gray-200">{t('timeline.unknown')}</span>
            )}
          </>
        )
      case 'note_created':
        return <>{t('timeline.createdNewNote')}</>
      default:
        return <>{t('timeline.performedAction')}</>
    }
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-sm dark:hover:shadow-md transition-shadow">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {getActivityText()}
        </p>
        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(parseISO(activity.created_at), 'h:mm a')}
          </span>
          {activity.project && (
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: activity.project.color }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-none">
                {activity.project.title}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}