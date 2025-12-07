'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export interface ActivityFilter {
  type: 'all' | 'project' | 'task' | 'note' | 'time_entry'
  dateRange: 'all' | 'today' | 'week' | 'month'
  search: string
}

interface ActivityFiltersProps {
  filter: ActivityFilter
  onFilterChange: (filter: ActivityFilter) => void
  onClear: () => void
}

export function ActivityFilters({ filter, onFilterChange, onClear }: ActivityFiltersProps) {
  const t = useTranslation()

  const hasActiveFilters = 
    filter.type !== 'all' ||
    filter.dateRange !== 'all' ||
    filter.search.trim() !== ''

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm sm:text-base font-medium dark:text-gray-200">{t('timeline.filters')}</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="ml-auto text-xs sm:text-sm"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('timeline.clear')}</span>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder={t('timeline.searchActivities')}
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="w-full"
          />
        </div>

        {/* Type Filter */}
        <Select
          value={filter.type}
          onValueChange={(value) => onFilterChange({ ...filter, type: value as any })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t('timeline.activityType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('timeline.allTypes')}</SelectItem>
            <SelectItem value="project">{t('timeline.projects')}</SelectItem>
            <SelectItem value="task">{t('timeline.tasks')}</SelectItem>
            <SelectItem value="note">{t('timeline.notes')}</SelectItem>
            <SelectItem value="time_entry">{t('timeline.timeEntries')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Select
          value={filter.dateRange}
          onValueChange={(value) => onFilterChange({ ...filter, dateRange: value as any })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t('timeline.dateRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('timeline.allTime')}</SelectItem>
            <SelectItem value="today">{t('timeline.today')}</SelectItem>
            <SelectItem value="week">{t('timeline.thisWeek')}</SelectItem>
            <SelectItem value="month">{t('timeline.thisMonth')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

