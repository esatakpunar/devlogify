'use client'

import { TimelineStats } from './TimelineStats'
import { TimelineContent } from './TimelineContent'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TimelinePageContentProps {
  completedTasks: number
  totalMinutes: number
  initialActivities: any[]
  userId: string
}

export function TimelinePageContent({
  completedTasks,
  totalMinutes,
  initialActivities,
  userId,
}: TimelinePageContentProps) {
  const t = useTranslation()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('timeline.title')}</h1>
        <p className="text-gray-600 mt-1">
          {t('timeline.description')}
        </p>
      </div>

      {/* Stats */}
      <TimelineStats
        completedTasks={completedTasks}
        totalMinutes={totalMinutes}
      />

      {/* Timeline Content */}
      <TimelineContent
        initialActivities={initialActivities}
        userId={userId}
      />
    </div>
  )
}

