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
        <h3 className="text-sm sm:text-base font-medium dark:text-gray-200">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="ml-auto text-xs sm:text-sm"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search activities..."
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
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="time_entry">Time Entries</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Select
          value={filter.dateRange}
          onValueChange={(value) => onFilterChange({ ...filter, dateRange: value as any })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

