'use client'

import { ActivityItem } from './ActivityItem'
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

  return (
    <div className="space-y-2 sm:space-y-3">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}