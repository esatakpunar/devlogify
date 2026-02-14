'use client'

import { useState, useCallback } from 'react'
import { getProjects } from '@/lib/supabase/queries/projects'
import { getRecentIncompleteTasks } from '@/lib/supabase/queries/tasks'
import { getNotes } from '@/lib/supabase/queries/notes'
import { useUserProfileStore } from '@/lib/store/userProfileStore'
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

function htmlToPlainText(content: string): string {
  if (!content) return ''

  if (typeof window === 'undefined') {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const tmp = document.createElement('div')
  tmp.innerHTML = content
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}

export function useGlobalSearch(userId: string) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { profile, fetchProfile } = useUserProfileStore()

  const resolveCompanyId = useCallback(async () => {
    if (profile?.company_id) return profile.company_id
    await fetchProfile(userId)
    return useUserProfileStore.getState().profile?.company_id || null
  }, [profile?.company_id, fetchProfile, userId])

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    setQuery(searchQuery)

    try {
      const companyId = await resolveCompanyId()
      if (!companyId) {
        setResults([])
        return
      }

      const [projects, tasks, notes] = await Promise.all([
        getProjects(companyId, 'active'),
        getRecentIncompleteTasks(companyId, 50),
        getNotes(companyId),
      ])

      const searchLower = searchQuery.toLowerCase()
      const allResults: SearchResult[] = []

      // Search projects
      projects?.forEach((project: Project) => {
        const projectPlainDescription = htmlToPlainText(project.description || '')
        if (
          project.title.toLowerCase().includes(searchLower) ||
          projectPlainDescription.toLowerCase().includes(searchLower)
        ) {
          allResults.push({
            type: 'project',
            id: project.id,
            title: project.title,
            subtitle: projectPlainDescription || undefined,
            url: `/projects/${project.id}`,
            metadata: { color: project.color, status: project.status },
          })
        }
      })

      // Search tasks
      tasks?.forEach((task: TaskWithProject) => {
        const taskNumberText = task.task_number ? `#${task.task_number}` : ''
        if (
          taskNumberText.toLowerCase().includes(searchLower) ||
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          allResults.push({
            type: 'task',
            id: task.id,
            title: task.title,
            subtitle: task.project?.title || task.description || undefined,
            url: `/kanban?task=${task.id}`,
            metadata: {
              taskNumber: task.task_number,
              status: task.status,
              priority: task.priority,
              projectColor: task.project?.color,
            },
          })
        }
      })

      // Search notes
      notes?.forEach((note: Note) => {
        const notePlainContent = htmlToPlainText(note.content)
        if (
          note.title?.toLowerCase().includes(searchLower) ||
          notePlainContent.toLowerCase().includes(searchLower) ||
          note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          allResults.push({
            type: 'note',
            id: note.id,
            title: note.title || 'Untitled Note',
            subtitle: notePlainContent.substring(0, 100) || undefined,
            url: `/notes?note=${note.id}`,
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
  }, [resolveCompanyId])

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
