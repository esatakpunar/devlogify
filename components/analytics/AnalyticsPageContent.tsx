'use client'

import { WeeklySummary } from './WeeklySummary'
import { TimeChart } from './TimeChart'
import { ProjectDistribution } from './ProjectDistribution'
import { ProductivityInsights } from './ProductivityInsights'
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
}

export function AnalyticsPageContent({
  weeklyStats,
  dailyTime,
  projectDistribution,
  mostProductiveDay,
  avgTaskDuration,
}: AnalyticsPageContentProps) {
  const t = useTranslation()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('analytics.title')}</h1>
        <p className="text-gray-600 mt-1">
          {t('analytics.description')}
        </p>
      </div>

      {/* Weekly Summary */}
      <WeeklySummary stats={weeklyStats} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
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

