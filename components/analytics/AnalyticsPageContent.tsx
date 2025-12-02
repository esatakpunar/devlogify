'use client'

import { WeeklySummary } from './WeeklySummary'
import { TimeChart } from './TimeChart'
import { ProjectDistribution } from './ProjectDistribution'
import { ProductivityInsights } from './ProductivityInsights'
import { HabitTracker } from './HabitTracker'
import { ProductivityScore } from './ProductivityScore'
import { GoalSetting } from './GoalSetting'
import { HeatmapCalendar } from './HeatmapCalendar'
import { TimeComparison } from './TimeComparison'
import { TimeInsights } from './TimeInsights'
import { TimeBlocking } from '@/components/timer/TimeBlocking'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface AnalyticsPageContentProps {
  weeklyStats: {
    currentWeek: {
      minutes: number
      tasks: number
    }
    lastWeek: {
      minutes: number
      tasks: number
    }
  }
  dailyTime: Array<{
    day: string
    minutes: number
  }>
  projectDistribution: Array<{
    title: string
    color: string
    minutes: number
  }>
  mostProductiveDay: {
    day: string
    minutes: number
  }
  avgTaskDuration: number
  userId: string
}

export function AnalyticsPageContent({
  weeklyStats,
  dailyTime,
  projectDistribution,
  mostProductiveDay,
  avgTaskDuration,
  userId,
}: AnalyticsPageContentProps) {
  const t = useTranslation()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t('analytics.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t('analytics.description')}
        </p>
      </div>

      {/* New Analytics Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <HabitTracker userId={userId} />
        <ProductivityScore userId={userId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <GoalSetting userId={userId} />
        <HeatmapCalendar userId={userId} />
      </div>

      {/* Weekly Summary */}
      <WeeklySummary stats={weeklyStats} />

      {/* Time Tracking Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <TimeComparison userId={userId} />
        <TimeInsights userId={userId} />
      </div>

      {/* Time Blocking */}
      <TimeBlocking userId={userId} />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <TimeChart data={dailyTime} />
        <ProjectDistribution data={projectDistribution} />
      </div>

      {/* Insights */}
      <ProductivityInsights 
        mostProductiveDay={mostProductiveDay}
        avgTaskDuration={avgTaskDuration}
        weeklyStats={weeklyStats}
      />
    </div>
  )
}

