'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, subDays } from 'date-fns'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import type { Database } from '@/types/supabase'

interface HeatmapCalendarProps {
  userId: string
}

interface DayData {
  date: Date
  value: number
  level: 0 | 1 | 2 | 3 | 4
}

export function HeatmapCalendar({ userId }: HeatmapCalendarProps) {
  const t = useTranslation()
  const [days, setDays] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  useEffect(() => {
    loadHeatmapData()
  }, [userId])

  const loadHeatmapData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get last 365 days
      const end = new Date()
      const start = subDays(end, 365)
      
      // Get completed tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'done')
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString())
      const tasks = (tasksData || []) as Pick<Database['public']['Tables']['tasks']['Row'], 'completed_at'>[]

      // Get time entries
      const { data: timeEntriesData } = await supabase
        .from('time_entries')
        .select('started_at, duration')
        .eq('user_id', userId)
        .gte('started_at', start.toISOString())
        .lte('started_at', end.toISOString())
        .not('duration', 'is', null)
      const timeEntries = (timeEntriesData || []) as Pick<
        Database['public']['Tables']['time_entries']['Row'],
        'started_at' | 'duration'
      >[]

      // Create activity map
      const activityMap = new Map<string, number>()
      
      tasks?.forEach(task => {
        if (task.completed_at) {
          const date = new Date(task.completed_at).toDateString()
          activityMap.set(date, (activityMap.get(date) || 0) + 1)
        }
      })

      timeEntries?.forEach(entry => {
        const date = new Date(entry.started_at).toDateString()
        const minutes = entry.duration || 0
        // Add minutes as activity points (1 hour = 1 point)
        activityMap.set(date, (activityMap.get(date) || 0) + minutes / 60)
      })

      // Create day data
      const allDays = eachDayOfInterval({ start, end })
      const dayData: DayData[] = allDays.map(date => {
        const dateStr = date.toDateString()
        const value = activityMap.get(dateStr) || 0
        
        // Determine level based on value
        let level: 0 | 1 | 2 | 3 | 4 = 0
        if (value > 0) level = 1
        if (value >= 2) level = 2
        if (value >= 4) level = 3
        if (value >= 6) level = 4

        return { date, value, level }
      })

      setDays(dayData)
    } catch (error) {
      console.error('Failed to load heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100 dark:bg-gray-800'
      case 1: return 'bg-green-200 dark:bg-green-900/30'
      case 2: return 'bg-green-400 dark:bg-green-700'
      case 3: return 'bg-green-600 dark:bg-green-600'
      case 4: return 'bg-green-800 dark:bg-green-500'
      default: return 'bg-gray-100 dark:bg-gray-800'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  // Group days by week for display
  const weeks: DayData[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Get month labels
  const monthLabels: string[] = []
  const currentYear = new Date().getFullYear()
  for (let month = 0; month < 12; month++) {
    const date = new Date(currentYear, month, 1)
    monthLabels.push(format(date, 'MMM'))
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('analytics.activityHeatmap')}</h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{t('analytics.less')}</span>
          <div className="flex gap-0.5 sm:gap-1">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-200 dark:bg-green-900/30"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-400 dark:bg-green-700"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-600 dark:bg-green-600"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-800 dark:bg-green-500"></div>
          </div>
          <span className="text-gray-500 dark:text-gray-400">{t('analytics.more')}</span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-0.5 sm:gap-1 min-w-max">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1">
                {week.map((day, dayIndex) => (
                  <Tooltip
                    key={`${weekIndex}-${dayIndex}`}
                    content={`${format(day.date, 'MMM dd, yyyy')}: ${day.value.toFixed(1)} ${t('analytics.activityPoints')}`}
                  >
                    <div
                      className={cn(
                        'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded cursor-pointer transition-all hover:scale-125',
                        getColor(day.level)
                      )}
                      onClick={() => setSelectedDay(day)}
                    />
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Info */}
        {selectedDay && (
          <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs sm:text-sm">
            <p className="font-medium dark:text-gray-200">{format(selectedDay.date, 'EEEE, MMMM dd, yyyy')}</p>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedDay.value.toFixed(1)} {t('analytics.activityPoints')}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('analytics.last365DaysOfActivity')}
        </p>
      </div>
    </Card>
  )
}
