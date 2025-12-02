'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { TrendingUp, Target, Clock, CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'

interface ProductivityScoreProps {
  userId: string
}

export function ProductivityScore({ userId }: ProductivityScoreProps) {
  const t = useTranslation()
  const [score, setScore] = useState(0)
  const [breakdown, setBreakdown] = useState({
    taskCompletion: 0,
    timeConsistency: 0,
    weeklyGrowth: 0,
    activityFrequency: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateScore()
  }, [userId])

  const calculateScore = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get tasks data
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, created_at, completed_at, estimated_duration, actual_duration')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      // Get time entries for consistency and weekly stats
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1) // Monday
      weekStart.setHours(0, 0, 0, 0)
      
      const lastWeekStart = new Date(weekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)

      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('started_at, duration')
        .eq('user_id', userId)
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('duration', 'is', null)

      // Calculate weekly stats manually
      const currentWeekMinutes = timeEntries?.filter(entry => {
        const entryDate = new Date(entry.started_at)
        return entryDate >= weekStart
      }).reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

      const lastWeekMinutes = timeEntries?.filter(entry => {
        const entryDate = new Date(entry.started_at)
        return entryDate >= lastWeekStart && entryDate < weekStart
      }).reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

      // Calculate metrics
      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Time consistency (days with activity in last 30 days)
      const activeDays = new Set()
      timeEntries?.forEach(entry => {
        const date = new Date(entry.started_at).toDateString()
        activeDays.add(date)
      })
      const timeConsistency = (activeDays.size / 30) * 100

      // Weekly growth
      const weeklyGrowth = lastWeekMinutes > 0 
        ? Math.min(((currentWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100, 100)
        : currentWeekMinutes > 0 ? 100 : 0

      // Activity frequency (tasks per day average)
      const tasksPerDay = totalTasks / 30
      const activityFrequency = Math.min((tasksPerDay / 5) * 100, 100) // 5 tasks/day = 100%

      const breakdownData = {
        taskCompletion: Math.round(taskCompletionRate),
        timeConsistency: Math.round(timeConsistency),
        weeklyGrowth: Math.round(Math.max(weeklyGrowth, 0)),
        activityFrequency: Math.round(activityFrequency),
      }

      setBreakdown(breakdownData)

      // Overall score (weighted average)
      const overallScore = Math.round(
        breakdownData.taskCompletion * 0.3 +
        breakdownData.timeConsistency * 0.3 +
        breakdownData.weeklyGrowth * 0.2 +
        breakdownData.activityFrequency * 0.2
      )

      setScore(overallScore)
    } catch (error) {
      console.error('Failed to calculate productivity score:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
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
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">Productivity Score</h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-4xl sm:text-5xl font-bold ${getScoreColor(score)} mb-2`}>
            {score}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {getScoreLabel(score)}
          </p>
          <ProgressBar value={score} className="mt-3 sm:mt-4" />
        </div>

        {/* Breakdown */}
        <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm dark:text-gray-300">Task Completion</span>
            </div>
            <span className="text-xs sm:text-sm font-medium dark:text-gray-300">{breakdown.taskCompletion}%</span>
          </div>
          <ProgressBar value={breakdown.taskCompletion} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm dark:text-gray-300">Time Consistency</span>
            </div>
            <span className="text-xs sm:text-sm font-medium dark:text-gray-300">{breakdown.timeConsistency}%</span>
          </div>
          <ProgressBar value={breakdown.timeConsistency} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm dark:text-gray-300">Weekly Growth</span>
            </div>
            <span className="text-xs sm:text-sm font-medium dark:text-gray-300">{breakdown.weeklyGrowth}%</span>
          </div>
          <ProgressBar value={breakdown.weeklyGrowth} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs sm:text-sm dark:text-gray-300">Activity Frequency</span>
            </div>
            <span className="text-xs sm:text-sm font-medium dark:text-gray-300">{breakdown.activityFrequency}%</span>
          </div>
          <ProgressBar value={breakdown.activityFrequency} className="h-2" />
        </div>
      </div>
    </Card>
  )
}

