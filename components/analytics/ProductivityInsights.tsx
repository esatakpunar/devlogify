'use client'

import { Calendar, Clock, TrendingUp, Zap } from 'lucide-react'

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
  const avgHours = Math.floor(avgTaskDuration / 60)
  const avgMins = avgTaskDuration % 60

  const insights = []

  // Most productive day
  if (mostProductiveDay.day !== 'N/A') {
    const hours = Math.floor(mostProductiveDay.minutes / 60)
    const mins = mostProductiveDay.minutes % 60
    insights.push({
      icon: Calendar,
      title: 'Most Productive Day',
      description: `${mostProductiveDay.day} with ${hours}h ${mins}m logged`,
      color: 'text-blue-600 bg-blue-50'
    })
  }

  // Average task duration
  if (avgTaskDuration > 0) {
    insights.push({
      icon: Clock,
      title: 'Average Task Duration',
      description: avgHours > 0 ? `${avgHours}h ${avgMins}m per completed task` : `${avgMins}m per completed task`,
      color: 'text-purple-600 bg-purple-50'
    })
  }

  // Productivity streak
  if (weeklyStats.currentWeek.tasks > 0) {
    insights.push({
      icon: Zap,
      title: 'Weekly Productivity',
      description: `You completed ${weeklyStats.currentWeek.tasks} tasks this week!`,
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
      title: 'Daily Average',
      description: hours > 0 ? `${hours}h ${mins}m of work per day` : `${mins}m of work per day`,
      color: 'text-green-600 bg-green-50'
    })
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Productivity Insights</h3>
        <p className="text-gray-500">Start working to see your insights!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Productivity Insights</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${insight.color}`}>
              <insight.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}