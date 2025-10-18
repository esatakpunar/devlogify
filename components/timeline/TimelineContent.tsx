'use client'

import { useState } from 'react'
import { ActivityFeed } from './ActivityFeed'
import { Button } from '@/components/ui/button'

interface Activity {
  id: string
  action_type: string
  created_at: string
  metadata: any
  project?: {
    id: string
    title: string
    color: string
  } | null
  task?: {
    id: string
    title: string
  } | null
}

interface TimelineContentProps {
  initialActivities: Activity[]
  userId: string
}

export function TimelineContent({ initialActivities, userId }: TimelineContentProps) {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Today', value: 'today' as const },
    { label: 'This Week', value: 'week' as const },
    { label: 'This Month', value: 'month' as const },
  ]

  // Filter activities based on selected filter
  const filterActivities = (activities: Activity[]) => {
    if (filter === 'all') return activities

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.created_at)
      
      switch (filter) {
        case 'today':
          return activityDate >= today
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return activityDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return activityDate >= monthAgo
        default:
          return true
      }
    })
  }

  const filteredActivities = filterActivities(initialActivities)

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 w-fit">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={filteredActivities} />
    </div>
  )
}