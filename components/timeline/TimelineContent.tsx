'use client'

import { useState } from 'react'
import { ActivityFeed } from './ActivityFeed'
import { ActivityFilters, type ActivityFilter } from './ActivityFilters'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { applyFilters, groupByDate } from '@/lib/utils/activityUtils'
import { format } from 'date-fns'

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
  const t = useTranslation()
  const [filter, setFilter] = useState<ActivityFilter>({
    type: 'all',
    dateRange: 'all',
    search: '',
  })
  const [groupBy, setGroupBy] = useState<'none' | 'date'>('date')

  const filteredActivities = applyFilters(initialActivities, filter)

  const handleClearFilters = () => {
    setFilter({
      type: 'all',
      dateRange: 'all',
      search: '',
    })
  }

  // Group activities if needed
  const groupedActivities = groupBy === 'date' 
    ? groupByDate(filteredActivities)
    : { 'all': filteredActivities }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Advanced Filters */}
      <ActivityFilters
        filter={filter}
        onFilterChange={setFilter}
        onClear={handleClearFilters}
      />

      {/* Grouping Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('timeline.groupBy') || 'Group by:'}</span>
        <Button
          variant={groupBy === 'date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setGroupBy(groupBy === 'date' ? 'none' : 'date')}
          className="w-full sm:w-auto"
        >
          {groupBy === 'date' ? (t('timeline.date') || 'Date') : (t('common.none') || 'None')}
        </Button>
      </div>

      {/* Activity Feed */}
      {groupBy === 'date' ? (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, activities]) => (
              <div key={date}>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                </h3>
                <ActivityFeed activities={activities} />
              </div>
            ))}
        </div>
      ) : (
        <ActivityFeed activities={filteredActivities} />
      )}
    </div>
  )
}