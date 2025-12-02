'use client'

import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, Loader2, CheckCircle2, Clock, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePremium } from '@/lib/hooks/usePremium'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface StandupSummary {
  yesterday: {
    completed: string[]
    timeSpent: string
    highlights: string[]
  }
  today: {
    planned: string[]
    priorities: string[]
    estimatedTime: string
  }
  insights: string[]
}

interface DailyStandupProps {
  userId: string
}

export function DailyStandup({ userId }: DailyStandupProps) {
  const t = useTranslation()
  const { isPremium, loading: premiumLoading } = usePremium(userId)
  const [summary, setSummary] = useState<StandupSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isPremium && !premiumLoading) {
      loadStandup()
    }
  }, [userId, isPremium, premiumLoading])

  const loadStandup = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/daily-standup')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('dashboard.dailyStandup.failedToLoad'))
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err: any) {
      console.error('Error loading standup:', err)
      setError(err.message || t('dashboard.dailyStandup.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  // Don't show component if user is not premium
  if (premiumLoading) {
    return null
  }

  if (!isPremium) {
    return null
  }

  if (loading && !summary) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.dailyStandup.title')}</h3>
        </div>
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (error && !summary) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.dailyStandup.title')}</h3>
        </div>
        <div className="text-center py-6 sm:py-8">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadStandup} className="text-xs sm:text-sm">
            {t('common.tryAgain')}
          </Button>
        </div>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.dailyStandup.title')}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={loadStandup} disabled={loading} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Yesterday */}
        <div>
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
            <h4 className="font-medium text-xs sm:text-sm dark:text-gray-200">{t('dashboard.dailyStandup.yesterday')}</h4>
            <Badge variant="outline" className="ml-auto text-xs">
              {summary.yesterday.timeSpent}
            </Badge>
          </div>
          {summary.yesterday.completed.length > 0 ? (
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {summary.yesterday.completed.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 flex-shrink-0">•</span>
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">{t('dashboard.dailyStandup.noActivitiesRecorded')}</p>
          )}
          {summary.yesterday.highlights.length > 0 && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1.5 sm:mb-2">
                {t('dashboard.dailyStandup.highlights')}
              </p>
              <ul className="space-y-1 text-xs text-green-700 dark:text-green-400">
                {summary.yesterday.highlights.map((highlight, index) => (
                  <li key={index} className="break-words">✨ {highlight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Today */}
        <div>
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
            <h4 className="font-medium text-xs sm:text-sm dark:text-gray-200">{t('dashboard.dailyStandup.today')}</h4>
            {summary.today.estimatedTime && (
              <Badge variant="outline" className="ml-auto text-xs">
                ~{summary.today.estimatedTime}
              </Badge>
            )}
          </div>
          {summary.today.planned.length > 0 ? (
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              {summary.today.planned.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1 flex-shrink-0">•</span>
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">{t('dashboard.dailyStandup.noTasksPlanned')}</p>
          )}
          {summary.today.priorities.length > 0 && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1.5 sm:mb-2">
                {t('dashboard.dailyStandup.priorities')}
              </p>
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                {summary.today.priorities.map((priority, index) => (
                  <li key={index} className="break-words">🎯 {priority}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Insights */}
        {summary.insights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
              <h4 className="font-medium text-xs sm:text-sm dark:text-gray-200">{t('dashboard.dailyStandup.insights')}</h4>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <ul className="space-y-1.5 sm:space-y-2 text-xs text-yellow-800 dark:text-yellow-300">
                {summary.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1 flex-shrink-0">💡</span>
                    <span className="break-words">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

