'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Database } from '@/types/supabase'

interface TimeInsightsProps {
  userId: string
}

interface Insight {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export function TimeInsights({ userId }: TimeInsightsProps) {
  const t = useTranslation()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [userId])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get last 30 days of time entries
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: timeEntriesData } = await supabase
        .from('time_entries')
        .select(`
          duration,
          started_at,
          task:tasks!inner(
            project:projects!inner(title, color)
          )
        `)
        .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .not('duration', 'is', null)
      const timeEntries = (timeEntriesData || []) as Array<{
        duration: Database['public']['Tables']['time_entries']['Row']['duration']
        started_at: Database['public']['Tables']['time_entries']['Row']['started_at']
        task?: {
          project?: {
            title: string
            color: string
          } | null
        } | null
      }>

      if (!timeEntries) return

      // Most time spent project
      const projectMap = new Map<string, { title: string; minutes: number }>()
      timeEntries.forEach((entry: any) => {
        const project = entry.task?.project
        if (project) {
          const existing = projectMap.get(project.title) || { title: project.title, minutes: 0 }
          existing.minutes += entry.duration || 0
          projectMap.set(project.title, existing)
        }
      })

      let mostTimeProject = { title: 'N/A', minutes: 0 }
      projectMap.forEach((project) => {
        if (project.minutes > mostTimeProject.minutes) {
          mostTimeProject = project
        }
      })

      // Most productive hours
      const hourMap = new Map<number, number>()
      timeEntries.forEach((entry: any) => {
        const hour = new Date(entry.started_at).getHours()
        hourMap.set(hour, (hourMap.get(hour) || 0) + (entry.duration || 0))
      })

      let mostProductiveHour = 0
      let maxMinutes = 0
      hourMap.forEach((minutes, hour) => {
        if (minutes > maxMinutes) {
          maxMinutes = minutes
          mostProductiveHour = hour
        }
      })

      // Average task duration
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('actual_duration')
        .eq('user_id', userId)
        .eq('status', 'done')
        .gt('actual_duration', 0)
        .limit(100)
      const tasks = (tasksData || []) as Pick<Database['public']['Tables']['tasks']['Row'], 'actual_duration'>[]

      const avgDuration = tasks && tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.actual_duration, 0) / tasks.length)
        : 0

      // Total time this month
      const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const totalHours = Math.floor(totalMinutes / 60)
      const remainingMinutes = totalMinutes % 60

      const insightsData: Insight[] = [
        {
          label: t('analytics.mostTimeSpent'),
          value: mostTimeProject.title,
          icon: Target,
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          label: t('analytics.mostProductiveHour'),
          value: mostProductiveHour > 0 
            ? `${mostProductiveHour}:00 - ${mostProductiveHour + 1}:00`
            : 'N/A',
          icon: Clock,
          color: 'text-green-600 dark:text-green-400',
        },
        {
          label: t('analytics.averageTaskDuration'),
          value: avgDuration > 0 ? `${avgDuration} ${t('common.min')}` : 'N/A',
          icon: TrendingUp,
          color: 'text-purple-600 dark:text-purple-400',
        },
        {
          label: t('analytics.totalTime30Days'),
          value: totalHours > 0 
            ? `${totalHours}${t('common.h')} ${remainingMinutes}${t('common.min')}`
            : `${totalMinutes}${t('common.min')}`,
          icon: Calendar,
          color: 'text-orange-600 dark:text-orange-400',
        },
      ]

      setInsights(insightsData)
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('analytics.timeInsights')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div
              key={index}
              className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${insight.color}`} />
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{insight.label}</p>
              </div>
              <p className="text-sm sm:text-lg font-semibold dark:text-gray-200 break-words">{insight.value}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
