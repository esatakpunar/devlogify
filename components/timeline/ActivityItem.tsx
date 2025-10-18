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
  task_created: 'bg-blue-50 text-blue-600',
  task_completed: 'bg-green-50 text-green-600',
  task_status_changed: 'bg-purple-50 text-purple-600',
  time_logged: 'bg-orange-50 text-orange-600',
  project_created: 'bg-indigo-50 text-indigo-600',
  note_created: 'bg-yellow-50 text-yellow-600',
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = activityIcons[activity.action_type as keyof typeof activityIcons] || Clock
  const colorClass = activityColors[activity.action_type as keyof typeof activityColors] || 'bg-gray-50 text-gray-600'

  const getActivityText = () => {
    switch (activity.action_type) {
      case 'task_created':
        return (
          <>
            Created task{' '}
            {activity.task && activity.project ? (
              <Link 
                href={`/projects/${activity.project.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {activity.task.title}
              </Link>
            ) : (
              <span className="font-medium">{activity.task?.title}</span>
            )}
          </>
        )
      case 'task_completed':
        return (
          <>
            Completed task{' '}
            <span className="font-medium">{activity.task?.title}</span>
          </>
        )
      case 'task_status_changed':
        return (
          <>
            Moved{' '}
            <span className="font-medium">{activity.task?.title}</span>
            {' '}to{' '}
            <span className="font-medium">{activity.metadata?.new_status || 'unknown'}</span>
          </>
        )
      case 'time_logged':
        const minutes = activity.metadata?.duration || 0
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return (
          <>
            Logged{' '}
            <span className="font-medium">
              {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
            </span>
            {activity.task && (
              <>
                {' '}on{' '}
                <span className="font-medium">{activity.task.title}</span>
              </>
            )}
          </>
        )
      case 'project_created':
        return (
          <>
            Created project{' '}
            {activity.project ? (
              <Link 
                href={`/projects/${activity.project.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {activity.project.title}
              </Link>
            ) : (
              <span className="font-medium">Unknown</span>
            )}
          </>
        )
      case 'note_created':
        return <>Created a new note</>
      default:
        return <>Performed an action</>
    }
  }

  return (
    <div className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          {getActivityText()}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">
            {format(parseISO(activity.created_at), 'h:mm a')}
          </span>
          {activity.project && (
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: activity.project.color }}
              />
              <span className="text-xs text-gray-500">{activity.project.title}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}