'use client'

import { useState, useCallback } from 'react'
import { getProjects } from '@/lib/supabase/queries/projects'
import { getRecentIncompleteTasks } from '@/lib/supabase/queries/tasks'
import { getNotes } from '@/lib/supabase/queries/notes'
import type { Project } from '@/lib/supabase/queries/projects'
import type { TaskWithProject } from '@/lib/supabase/queries/tasks'
import type { Note } from '@/lib/supabase/queries/notes'

export interface SearchResult {
  type: 'project' | 'task' | 'note'
  id: string
  title: string
  subtitle?: string
  url: string
  metadata?: Record<string, any>
}

export function useGlobalSearch(userId: string) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    setQuery(searchQuery)

    try {
      const [projects, tasks, notes] = await Promise.all([
        getProjects(userId, 'active'),
        getRecentIncompleteTasks(userId, 50),
        getNotes(userId),
      ])

      const searchLower = searchQuery.toLowerCase()
      const allResults: SearchResult[] = []

      // Search projects
      projects?.forEach((project: Project) => {
        if (
          project.title.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower)
        ) {
          allResults.push({
            type: 'project',
            id: project.id,
            title: project.title,
            subtitle: project.description || undefined,
            url: `/projects/${project.id}`,
            metadata: { color: project.color, status: project.status },
          })
        }
      })

      // Search tasks
      tasks?.forEach((task: TaskWithProject) => {
        if (
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          allResults.push({
            type: 'task',
            id: task.id,
            title: task.title,
            subtitle: task.project?.title || task.description || undefined,
            url: `/projects/${task.project_id}`,
            metadata: {
              status: task.status,
              priority: task.priority,
              projectColor: task.project?.color,
            },
          })
        }
      })

      // Search notes
      notes?.forEach((note: Note) => {
        if (
          note.title?.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          allResults.push({
            type: 'note',
            id: note.id,
            title: note.title || 'Untitled Note',
            subtitle: note.content.substring(0, 100) || undefined,
            url: '/notes',
            metadata: { isPinned: note.is_pinned },
          })
        }
      })

      // Sort by relevance (exact matches first, then partial matches)
      allResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === searchLower
        const bExact = b.title.toLowerCase() === searchLower
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return 0
      })

      setResults(allResults)
    } catch (err: any) {
      setError(err.message || 'Failed to search')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    results,
    loading,
    error,
    search,
    clear,
  }
}

