'use client'

import { ActivityItem } from './ActivityItem'
import { format, isToday, isYesterday, parseISO } from 'date-fns'

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

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No activities yet</p>
        <p className="text-sm text-gray-400 mt-2">Start working on tasks to see your activity here</p>
      </div>
    )
  }

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = format(parseISO(activity.created_at), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, Activity[]>)

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM dd, yyyy')
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedActivities).map(([date, dayActivities]) => (
        <div key={date}>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {getDateLabel(date)}
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="space-y-3">
            {dayActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}