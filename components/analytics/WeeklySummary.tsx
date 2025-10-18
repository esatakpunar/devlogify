'use client'

import { Clock, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'

interface WeeklySummaryProps {
  stats: {
    currentWeek: {
      minutes: number
      tasks: number
    }
    lastWeek: {
      minutes: number
      tasks: number
    }
  }
}

export function WeeklySummary({ stats }: WeeklySummaryProps) {
  const { currentWeek, lastWeek } = stats

  const currentHours = Math.floor(currentWeek.minutes / 60)
  const currentMins = currentWeek.minutes % 60

  const timeDiff = currentWeek.minutes - lastWeek.minutes
  const timePercentage = lastWeek.minutes > 0 
    ? Math.round((timeDiff / lastWeek.minutes) * 100)
    : 0

  const taskDiff = currentWeek.tasks - lastWeek.tasks
  const taskPercentage = lastWeek.tasks > 0
    ? Math.round((taskDiff / lastWeek.tasks) * 100)
    : 0

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <h2 className="text-xl font-semibold mb-6">This Week's Summary</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Time Logged */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Time Logged</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {currentHours}h {currentMins}m
            </span>
          </div>
          {lastWeek.minutes > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {timeDiff >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm">
                {Math.abs(timePercentage)}% {timeDiff >= 0 ? 'more' : 'less'} than last week
              </span>
            </div>
          )}
        </div>

        {/* Tasks Completed */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Tasks Completed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{currentWeek.tasks}</span>
            <span className="text-sm opacity-80">tasks</span>
          </div>
          {lastWeek.tasks > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {taskDiff >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm">
                {Math.abs(taskPercentage)}% {taskDiff >= 0 ? 'more' : 'less'} than last week
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}