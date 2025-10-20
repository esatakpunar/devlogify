'use client'

import { ProgressBar } from '@/components/ui/progress-bar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimated_duration: number | null
  actual_duration: number
  progress: number
  order_index: number
  created_at: string
}

interface ProjectProgressStatsProps {
  tasks: Task[]
}

export function ProjectProgressStats({ tasks }: ProjectProgressStatsProps) {
  // Calculate overall project progress
  const overallProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
    : 0

  // Calculate progress distribution
  const progressDistribution = {
    '0-25%': tasks.filter(t => t.progress >= 0 && t.progress <= 25).length,
    '26-50%': tasks.filter(t => t.progress >= 26 && t.progress <= 50).length,
    '51-75%': tasks.filter(t => t.progress >= 51 && t.progress <= 75).length,
    '76-100%': tasks.filter(t => t.progress >= 76 && t.progress <= 100).length,
  }

  // Calculate status distribution
  const statusDistribution = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  // Calculate time statistics
  const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimated_duration || 0), 0)
  const totalActualTime = tasks.reduce((sum, task) => sum + task.actual_duration, 0)
  const completedTasks = tasks.filter(t => t.status === 'done').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ProgressBar value={overallProgress} showPercentage size="lg" />
            <div className="text-xs text-gray-500">
              {completedTasks} of {tasks.length} tasks completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Progress Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(progressDistribution).map(([range, count]) => (
              <div key={range} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{range}</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs',
                    status === 'todo' && 'bg-gray-100 text-gray-700',
                    status === 'in_progress' && 'bg-blue-100 text-blue-700',
                    status === 'done' && 'bg-green-100 text-green-700'
                  )}
                >
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Statistics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Time Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Estimated</span>
              <span className="text-xs font-medium">{totalEstimatedTime}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Actual</span>
              <span className="text-xs font-medium">{totalActualTime}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Difference</span>
              <span className={cn(
                'text-xs font-medium',
                totalActualTime > totalEstimatedTime ? 'text-red-600' : 'text-green-600'
              )}>
                {totalActualTime > totalEstimatedTime ? '+' : ''}{totalActualTime - totalEstimatedTime}m
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
