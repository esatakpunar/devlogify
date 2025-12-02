'use client'

import { ActivityItem } from './ActivityItem'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
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

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const t = useTranslation()
  
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('timeline.noActivitiesYet')}</p>
        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-2">{t('timeline.startWorkingToSeeActivity')}</p>
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
    if (isToday(date)) return t('timeline.today')
    if (isYesterday(date)) return t('timeline.yesterday')
    return format(date, 'MMMM dd, yyyy')
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {Object.entries(groupedActivities).map(([date, dayActivities]) => (
        <div key={date}>
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200">
              {getDateLabel(date)}
            </h3>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {dayActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}