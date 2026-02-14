'use client'

import { useEffect, useState } from 'react'
import { ActivityFeed } from './ActivityFeed'
import { ActivityFilters, type ActivityFilter } from './ActivityFilters'
import { applyFilters, groupByDate } from '@/lib/utils/activityUtils'
import { format } from 'date-fns'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/button'
import { tr } from 'date-fns/locale/tr'
import { enUS } from 'date-fns/locale/en-US'
import { de } from 'date-fns/locale/de'
import { es } from 'date-fns/locale/es'

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

const localeMap = {
  tr,
  en: enUS,
  de,
  es,
}

export function TimelineContent({ initialActivities, userId }: TimelineContentProps) {
  const { locale } = useLanguage()
  const GROUP_PAGE_SIZE = 7
  const [filter, setFilter] = useState<ActivityFilter>({
    type: 'all',
    dateRange: 'all',
    search: '',
  })
  const [visibleGroupCount, setVisibleGroupCount] = useState(GROUP_PAGE_SIZE)

  const filteredActivities = applyFilters(initialActivities, filter)

  const handleClearFilters = () => {
    setFilter({
      type: 'all',
      dateRange: 'all',
      search: '',
    })
  }

  // Always group activities by date
  const groupedActivities = groupByDate(filteredActivities)
  const sortedGroupedActivities = Object.entries(groupedActivities)
    .sort(([a], [b]) => b.localeCompare(a))
  const visibleGroups = sortedGroupedActivities.slice(0, visibleGroupCount)

  useEffect(() => {
    setVisibleGroupCount(GROUP_PAGE_SIZE)
  }, [filter.type, filter.dateRange, filter.search])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Advanced Filters */}
      <ActivityFilters
        filter={filter}
        onFilterChange={setFilter}
        onClear={handleClearFilters}
      />

      {/* Activity Feed - Always grouped by date */}
      <div className="space-y-4 sm:space-y-6">
        {sortedGroupedActivities.length === 0 ? (
          <ActivityFeed activities={[]} />
        ) : (
          <>
            {visibleGroups.map(([date, activities]) => (
              <div key={date}>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  {format(new Date(date), 'EEEE, MMMM dd, yyyy', { locale: localeMap[locale] })}
                </h3>
                <ActivityFeed activities={activities} />
              </div>
            ))}
            {sortedGroupedActivities.length > visibleGroups.length && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleGroupCount((prev) => prev + GROUP_PAGE_SIZE)}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
