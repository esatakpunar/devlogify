'use client'

import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, Loader2, CheckCircle2, Clock, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  const [summary, setSummary] = useState<StandupSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStandup()
  }, [userId])

  const loadStandup = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/daily-standup')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load standup')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err: any) {
      console.error('Error loading standup:', err)
      setError(err.message || 'Failed to load standup')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !summary) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Today's Standup</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (error && !summary) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Today's Standup</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadStandup}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Today's Standup</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={loadStandup} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Yesterday */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-sm">Yesterday</h4>
            <Badge variant="outline" className="ml-auto text-xs">
              {summary.yesterday.timeSpent}
            </Badge>
          </div>
          {summary.yesterday.completed.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {summary.yesterday.completed.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No activities recorded</p>
          )}
          {summary.yesterday.highlights.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-2">
                Highlights:
              </p>
              <ul className="space-y-1 text-xs text-green-700 dark:text-green-400">
                {summary.yesterday.highlights.map((highlight, index) => (
                  <li key={index}>✨ {highlight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Today */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-sm">Today</h4>
            {summary.today.estimatedTime && (
              <Badge variant="outline" className="ml-auto text-xs">
                ~{summary.today.estimatedTime}
              </Badge>
            )}
          </div>
          {summary.today.planned.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {summary.today.planned.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No tasks planned</p>
          )}
          {summary.today.priorities.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">
                Priorities:
              </p>
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                {summary.today.priorities.map((priority, index) => (
                  <li key={index}>🎯 {priority}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Insights */}
        {summary.insights.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              <h4 className="font-medium text-sm">Insights</h4>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <ul className="space-y-2 text-xs text-yellow-800 dark:text-yellow-300">
                {summary.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">💡</span>
                    <span>{insight}</span>
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

