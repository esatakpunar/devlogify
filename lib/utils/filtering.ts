/**
 * Filtering utilities for tasks, projects, and notes
 */

export interface TaskFilter {
  tags?: string[]
  status?: ('todo' | 'in_progress' | 'done')[]
  priority?: ('low' | 'medium' | 'high')[]
  dateRange?: {
    field: 'created_at' | 'completed_at'
    start?: Date
    end?: Date
  }
  durationRange?: {
    field: 'estimated_duration' | 'actual_duration'
    min?: number
    max?: number
  }
  projectId?: string
  searchQuery?: string
}

export interface ProjectFilter {
  status?: ('active' | 'archived' | 'completed')[]
  searchQuery?: string
  isPinned?: boolean
}

export interface NoteFilter {
  tags?: string[]
  projectId?: string
  isPinned?: boolean
  searchQuery?: string
}

export interface SavedFilter {
  id: string
  name: string
  type: 'task' | 'project' | 'note'
  filter: TaskFilter | ProjectFilter | NoteFilter
  createdAt: string
}

/**
 * Filter tasks based on filter criteria
 */
export function filterTasks<T extends {
  title: string
  description?: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  tags?: string[] | null
  created_at: string
  completed_at?: string | null
  estimated_duration?: number | null
  actual_duration?: number
  project_id?: string
}>(
  tasks: T[],
  filter: TaskFilter
): T[] {
  return tasks.filter((task) => {
    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(query)
      const matchesDescription = task.description?.toLowerCase().includes(query) || false
      const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(query)) || false
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false
      }
    }

    // Tags
    if (filter.tags && filter.tags.length > 0) {
      const taskTags = task.tags || []
      const hasAllTags = filter.tags.every(tag => taskTags.includes(tag))
      if (!hasAllTags) {
        return false
      }
    }

    // Status
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(task.status)) {
        return false
      }
    }

    // Priority
    if (filter.priority && filter.priority.length > 0) {
      if (!filter.priority.includes(task.priority)) {
        return false
      }
    }

    // Date range
    if (filter.dateRange) {
      const { field, start, end } = filter.dateRange
      const taskDate = field === 'created_at' 
        ? new Date(task.created_at)
        : task.completed_at ? new Date(task.completed_at) : null
      
      if (!taskDate) {
        if (field === 'completed_at') return false
      } else {
        if (start && taskDate < start) return false
        if (end && taskDate > end) return false
      }
    }

    // Duration range
    if (filter.durationRange) {
      const { field, min, max } = filter.durationRange
      const duration = field === 'estimated_duration' 
        ? task.estimated_duration 
        : task.actual_duration
      
      if (duration === null || duration === undefined) {
        return false
      }
      if (min !== undefined && duration < min) return false
      if (max !== undefined && duration > max) return false
    }

    // Project ID
    if (filter.projectId) {
      if (task.project_id !== filter.projectId) {
        return false
      }
    }

    return true
  })
}

/**
 * Filter projects based on filter criteria
 */
export function filterProjects<T extends {
  title: string
  description?: string | null
  status: 'active' | 'archived' | 'completed'
  is_pinned?: boolean
}>(
  projects: T[],
  filter: ProjectFilter
): T[] {
  return projects.filter((project) => {
    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const matchesTitle = project.title.toLowerCase().includes(query)
      const matchesDescription = project.description?.toLowerCase().includes(query) || false
      if (!matchesTitle && !matchesDescription) {
        return false
      }
    }

    // Status
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(project.status)) {
        return false
      }
    }

    // Pinned
    if (filter.isPinned !== undefined) {
      if (project.is_pinned !== filter.isPinned) {
        return false
      }
    }

    return true
  })
}

/**
 * Filter notes based on filter criteria
 */
export function filterNotes<T extends {
  title?: string | null
  content: string
  tags?: string[] | null
  project_id?: string | null
  is_pinned?: boolean
}>(
  notes: T[],
  filter: NoteFilter
): T[] {
  return notes.filter((note) => {
    // Search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      const matchesTitle = note.title?.toLowerCase().includes(query) || false
      const matchesContent = note.content.toLowerCase().includes(query)
      const matchesTags = note.tags?.some(tag => tag.toLowerCase().includes(query)) || false
      if (!matchesTitle && !matchesContent && !matchesTags) {
        return false
      }
    }

    // Tags
    if (filter.tags && filter.tags.length > 0) {
      const noteTags = note.tags || []
      const hasAllTags = filter.tags.every(tag => noteTags.includes(tag))
      if (!hasAllTags) {
        return false
      }
    }

    // Project ID
    if (filter.projectId) {
      if (note.project_id !== filter.projectId) {
        return false
      }
    }

    // Pinned
    if (filter.isPinned !== undefined) {
      if (note.is_pinned !== filter.isPinned) {
        return false
      }
    }

    return true
  })
}

/**
 * Quick filter presets
 */
export const quickFilters = {
  tasks: {
    todayCompleted: (): TaskFilter => ({
      status: ['done'],
      dateRange: {
        field: 'completed_at',
        start: new Date(new Date().setHours(0, 0, 0, 0)),
        end: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    thisWeek: (): TaskFilter => ({
      dateRange: {
        field: 'created_at',
        start: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    }),
    highPriority: (): TaskFilter => ({
      priority: ['high'],
      status: ['todo', 'in_progress'],
    }),
    inProgress: (): TaskFilter => ({
      status: ['in_progress'],
    }),
    overdue: (): TaskFilter => ({
      status: ['todo', 'in_progress'],
      dateRange: {
        field: 'created_at',
        end: new Date(), // Tasks created before today
      },
      // Note: This filter assumes tasks have a due_date field or completion logic
      // For full overdue functionality, you'd need to add due_date to tasks
    }),
  },
  projects: {
    active: (): ProjectFilter => ({
      status: ['active'],
    }),
    pinned: (): ProjectFilter => ({
      isPinned: true,
    }),
  },
  notes: {
    pinned: (): NoteFilter => ({
      isPinned: true,
    }),
    recent: (): NoteFilter => ({
      // Recent notes (last 7 days) - date filtering would be handled in the query
      // This is a placeholder filter that can be used with date-based queries
    }),
  },
}

/**
 * Save filter to localStorage
 */
export function saveFilter(filter: SavedFilter): void {
  try {
    const saved = getSavedFilters()
    saved.push(filter)
    localStorage.setItem('devlogify-saved-filters', JSON.stringify(saved))
  } catch (error) {
    console.error('Failed to save filter:', error)
  }
}

/**
 * Get all saved filters
 */
export function getSavedFilters(): SavedFilter[] {
  try {
    const saved = localStorage.getItem('devlogify-saved-filters')
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Failed to get saved filters:', error)
    return []
  }
}

/**
 * Delete saved filter
 */
export function deleteSavedFilter(id: string): void {
  try {
    const saved = getSavedFilters()
    const filtered = saved.filter(f => f.id !== id)
    localStorage.setItem('devlogify-saved-filters', JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete filter:', error)
  }
}

/**
 * Save search history
 */
export function saveSearchHistory(query: string, type: 'task' | 'project' | 'note'): void {
  try {
    const key = `devlogify-search-history-${type}`
    const history = getSearchHistory(type)
    const updated = [query, ...history.filter(h => h !== query)].slice(0, 10) // Keep last 10
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

/**
 * Get search history
 */
export function getSearchHistory(type: 'task' | 'project' | 'note'): string[] {
  try {
    const key = `devlogify-search-history-${type}`
    const history = localStorage.getItem(key)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Failed to get search history:', error)
    return []
  }
}

