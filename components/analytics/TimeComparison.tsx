'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'

interface TimeComparisonProps {
  userId: string
}

interface TaskComparison {
  taskId: string
  title: string
  estimated: number
  actual: number
  difference: number
  percentage: number
}

export function TimeComparison({ userId }: TimeComparisonProps) {
  const t = useTranslation()
  const [comparisons, setComparisons] = useState<TaskComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    avgDifference: 0,
    tasksOverEstimate: 0,
    tasksUnderEstimate: 0,
    accuracy: 0,
  })

  useEffect(() => {
    loadComparisonData()
  }, [userId])

  const loadComparisonData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get completed tasks with estimates and actual durations
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, estimated_duration, actual_duration')
        .eq('user_id', userId)
        .eq('status', 'done')
        .not('estimated_duration', 'is', null)
        .gt('actual_duration', 0)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (!tasks) return

      const comparisonData: TaskComparison[] = tasks
        .filter(task => task.estimated_duration && task.actual_duration > 0)
        .map(task => {
          const estimated = task.estimated_duration || 0
          const actual = task.actual_duration
          const difference = actual - estimated
          const percentage = estimated > 0 ? ((actual - estimated) / estimated) * 100 : 0

          return {
            taskId: task.id,
            title: task.title,
            estimated,
            actual,
            difference,
            percentage: Math.round(percentage),
          }
        })

      setComparisons(comparisonData)

      // Calculate stats
      const differences = comparisonData.map(c => c.difference)
      const avgDifference = differences.length > 0
        ? Math.round(differences.reduce((a, b) => a + b, 0) / differences.length)
        : 0

      const tasksOverEstimate = comparisonData.filter(c => c.difference > 0).length
      const tasksUnderEstimate = comparisonData.filter(c => c.difference < 0).length

      // Accuracy: tasks within 20% of estimate
      const accurate = comparisonData.filter(c => Math.abs(c.percentage) <= 20).length
      const accuracy = comparisonData.length > 0
        ? Math.round((accurate / comparisonData.length) * 100)
        : 0

      setStats({
        avgDifference,
        tasksOverEstimate,
        tasksUnderEstimate,
        accuracy,
      })
    } catch (error) {
      console.error('Failed to load comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  const chartData = comparisons.slice(0, 10).map(c => ({
    name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
    estimated: c.estimated,
    actual: c.actual,
  }))

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">Time Estimates vs Actual</h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Difference</p>
            <p className="text-base sm:text-lg font-bold dark:text-gray-200">
              {stats.avgDifference > 0 ? '+' : ''}
              {stats.avgDifference} min
            </p>
          </div>
          <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Over Estimate</p>
            <p className="text-base sm:text-lg font-bold dark:text-gray-200">{stats.tasksOverEstimate}</p>
          </div>
          <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Under Estimate</p>
            <p className="text-base sm:text-lg font-bold dark:text-gray-200">{stats.tasksUnderEstimate}</p>
          </div>
          <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Accuracy</p>
            <p className="text-base sm:text-lg font-bold dark:text-gray-200">{stats.accuracy}%</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={10}
                  className="sm:h-20 sm:text-xs"
                />
                <YAxis fontSize={10} className="sm:text-xs" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="estimated" fill="#3b82f6" name="Estimated" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            No comparison data available. Complete tasks with time estimates to see comparisons.
          </div>
        )}
      </div>
    </Card>
  )
}

