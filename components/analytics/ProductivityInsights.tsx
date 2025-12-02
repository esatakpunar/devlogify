'use client'

import { Calendar, Clock, TrendingUp, Zap } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProductivityInsightsProps {
  mostProductiveDay: {
    day: string
    minutes: number
  }
  avgTaskDuration: number
  weeklyStats: {
    currentWeek: {
      minutes: number
      tasks: number
    }
  }
}

export function ProductivityInsights({ 
  mostProductiveDay, 
  avgTaskDuration,
  weeklyStats 
}: ProductivityInsightsProps) {
  const t = useTranslation()
  const avgHours = Math.floor(avgTaskDuration / 60)
  const avgMins = avgTaskDuration % 60

  const insights = []

  // Most productive day
  if (mostProductiveDay.day !== 'N/A') {
    const hours = Math.floor(mostProductiveDay.minutes / 60)
    const mins = mostProductiveDay.minutes % 60
    insights.push({
      icon: Calendar,
      title: t('analytics.mostProductiveDay'),
      description: `${mostProductiveDay.day} ${t('analytics.withLogged', { hours, minutes: mins })}`,
      color: 'text-blue-600 bg-blue-50'
    })
  }

  // Average task duration
  if (avgTaskDuration > 0) {
    insights.push({
      icon: Clock,
      title: t('analytics.averageTaskDuration'),
      description: avgHours > 0 
        ? `${avgHours}h ${avgMins}m ${t('analytics.perCompletedTask')}` 
        : `${avgMins}m ${t('analytics.perCompletedTask')}`,
      color: 'text-purple-600 bg-purple-50'
    })
  }

  // Productivity streak
  if (weeklyStats.currentWeek.tasks > 0) {
    insights.push({
      icon: Zap,
      title: t('analytics.weeklyProductivity'),
      description: t('analytics.completedTasksThisWeek', { count: weeklyStats.currentWeek.tasks }),
      color: 'text-orange-600 bg-orange-50'
    })
  }

  // Consistency
  if (weeklyStats.currentWeek.minutes > 0) {
    const dailyAvg = Math.round(weeklyStats.currentWeek.minutes / 7)
    const hours = Math.floor(dailyAvg / 60)
    const mins = dailyAvg % 60
    insights.push({
      icon: TrendingUp,
      title: t('analytics.dailyAverage'),
      description: hours > 0 
        ? `${hours}h ${mins}m ${t('analytics.ofWorkPerDay')}` 
        : `${mins}m ${t('analytics.ofWorkPerDay')}`,
      color: 'text-green-600 bg-green-50'
    })
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('analytics.productivityInsights')}</h3>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('analytics.startWorkingToSeeInsights')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('analytics.productivityInsights')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.color}`}>
              <insight.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-xs sm:text-sm dark:text-gray-200">{insight.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}