'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Calendar } from 'lucide-react'
import { format, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'

interface HabitTrackerProps {
  userId: string
}

interface DayActivity {
  date: Date
  hasActivity: boolean
  tasksCompleted: number
  minutesSpent: number
}

export function HabitTracker({ userId }: HabitTrackerProps) {
  const t = useTranslation()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [weekActivity, setWeekActivity] = useState<DayActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHabitData()
  }, [userId])

  const loadHabitData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get last 30 days of activity
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get completed tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'done')
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false })

      // Get time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('started_at, duration')
        .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .not('duration', 'is', null)

      // Create activity map
      const activityMap = new Map<string, { tasks: number; minutes: number }>()
      
      tasks?.forEach(task => {
        if (task.completed_at) {
          const date = new Date(task.completed_at).toDateString()
          const existing = activityMap.get(date) || { tasks: 0, minutes: 0 }
          existing.tasks += 1
          activityMap.set(date, existing)
        }
      })

      timeEntries?.forEach(entry => {
        const date = new Date(entry.started_at).toDateString()
        const existing = activityMap.get(date) || { tasks: 0, minutes: 0 }
        existing.minutes += entry.duration || 0
        activityMap.set(date, existing)
      })

      // Calculate streaks
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let streak = 0
      let checkDate = new Date(today)
      
      // Current streak (backwards from today)
      while (true) {
        const dateStr = checkDate.toDateString()
        const activity = activityMap.get(dateStr)
        if (activity && (activity.tasks > 0 || activity.minutes > 0)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
      setCurrentStreak(streak)

      // Longest streak (scan all 30 days)
      let longest = 0
      let current = 0
      const allDates = eachDayOfInterval({ start: thirtyDaysAgo, end: today })
      
      allDates.forEach(date => {
        const dateStr = date.toDateString()
        const activity = activityMap.get(dateStr)
        if (activity && (activity.tasks > 0 || activity.minutes > 0)) {
          current++
          longest = Math.max(longest, current)
        } else {
          current = 0
        }
      })
      setLongestStreak(longest)

      // Week activity
      const weekStart = startOfWeek(today, { weekStartsOn: 1 })
      const weekDays = eachDayOfInterval({ start: weekStart, end: today })
      const weekData = weekDays.map(date => {
        const dateStr = date.toDateString()
        const activity = activityMap.get(dateStr) || { tasks: 0, minutes: 0 }
        return {
          date,
          hasActivity: activity.tasks > 0 || activity.minutes > 0,
          tasksCompleted: activity.tasks,
          minutesSpent: activity.minutes,
        }
      })
      setWeekActivity(weekData)
    } catch (error) {
      console.error('Failed to load habit data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">Habit Tracker</h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Streaks */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Current Streak</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Longest Streak</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Week Activity */}
        <div>
          <p className="text-xs sm:text-sm font-medium mb-2 dark:text-gray-300">This Week</p>
          <div className="flex gap-1 sm:gap-2">
            {weekActivity.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`
                    w-full h-8 sm:h-10 rounded flex items-center justify-center text-xs font-semibold
                    ${day.hasActivity 
                      ? 'bg-green-500 dark:bg-green-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                    }
                  `}
                  title={`${format(day.date, 'EEEE')}: ${day.tasksCompleted} tasks, ${day.minutesSpent} min`}
                >
                  {day.hasActivity ? '✓' : ''}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(day.date, 'EEE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

