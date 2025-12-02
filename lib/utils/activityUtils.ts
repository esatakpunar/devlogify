/**
 * Activity feed utilities
 */

import { format, startOfDay, startOfWeek, startOfMonth, isSameDay, isSameWeek, isSameMonth } from 'date-fns'

export interface Activity {
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

export interface ActivityFilter {
  type: 'all' | 'project' | 'task' | 'note' | 'time_entry'
  dateRange: 'all' | 'today' | 'week' | 'month'
  search: string
}

/**
 * Filter activities by type
 */
export function filterByType(activities: Activity[], type: ActivityFilter['type']): Activity[] {
  if (type === 'all') return activities

  return activities.filter(activity => {
    const actionType = activity.action_type.toLowerCase()
    
    switch (type) {
      case 'project':
        return actionType.includes('project')
      case 'task':
        return actionType.includes('task')
      case 'note':
        return actionType.includes('note')
      case 'time_entry':
        return actionType.includes('time') || actionType.includes('timer')
      default:
        return true
    }
  })
}

/**
 * Filter activities by date range
 */
export function filterByDateRange(activities: Activity[], range: ActivityFilter['dateRange']): Activity[] {
  if (range === 'all') return activities

  const now = new Date()
  const today = startOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)

  return activities.filter(activity => {
    const activityDate = new Date(activity.created_at)

    switch (range) {
      case 'today':
        return isSameDay(activityDate, now)
      case 'week':
        return activityDate >= weekStart
      case 'month':
        return activityDate >= monthStart
      default:
        return true
    }
  })
}

/**
 * Filter activities by search query
 */
export function filterBySearch(activities: Activity[], search: string): Activity[] {
  if (!search.trim()) return activities

  const searchLower = search.toLowerCase()

  return activities.filter(activity => {
    const projectTitle = activity.project?.title.toLowerCase() || ''
    const taskTitle = activity.task?.title.toLowerCase() || ''
    const actionType = activity.action_type.toLowerCase()
    const metadata = JSON.stringify(activity.metadata || {}).toLowerCase()

    return (
      projectTitle.includes(searchLower) ||
      taskTitle.includes(searchLower) ||
      actionType.includes(searchLower) ||
      metadata.includes(searchLower)
    )
  })
}

/**
 * Group activities by date
 */
export function groupByDate(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {}

  activities.forEach(activity => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
  })

  return groups
}

/**
 * Group activities by type
 */
export function groupByType(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {}

  activities.forEach(activity => {
    const type = activity.action_type.split('_')[0] // e.g., 'task_created' -> 'task'
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(activity)
  })

  return groups
}

/**
 * Apply all filters
 */
export function applyFilters(
  activities: Activity[],
  filter: ActivityFilter
): Activity[] {
  let filtered = activities

  filtered = filterByType(filtered, filter.type)
  filtered = filterByDateRange(filtered, filter.dateRange)
  filtered = filterBySearch(filtered, filter.search)

  return filtered
}

