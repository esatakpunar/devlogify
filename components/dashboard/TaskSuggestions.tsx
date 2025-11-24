'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Plus, Loader2, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AICreateTasksDialog } from '@/components/tasks/AICreateTasksDialog'
import { getProjects } from '@/lib/supabase/queries/projects'
import { usePremium } from '@/lib/hooks/usePremium'

interface TaskSuggestion {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number
  reason: string
  related_task_ids?: string[]
}

interface TaskSuggestionsProps {
  userId: string
}

export function TaskSuggestions({ userId }: TaskSuggestionsProps) {
  const { isPremium, loading: premiumLoading } = usePremium(userId)
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<TaskSuggestion | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Prevent double loading
    if (!hasLoadedRef.current && isPremium && !premiumLoading) {
      hasLoadedRef.current = true
      loadSuggestions()
      loadProjects()
    }
  }, [userId, isPremium, premiumLoading])

  const loadSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/suggest-tasks')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (err: any) {
      console.error('Error loading suggestions:', err)
      setError(err.message || 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects(userId, 'active')
      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleCreateTask = (suggestion: TaskSuggestion) => {
    if (projects.length === 0) {
      // No projects, navigate to projects page
      window.location.href = '/projects'
      return
    }
    
    // Open AI dialog with suggestion pre-filled
    setSelectedSuggestion(suggestion)
    setAiDialogOpen(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // Don't show component if user is not premium
  if (premiumLoading) {
    return null
  }

  if (!isPremium) {
    return null
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Task Suggestions</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Task Suggestions</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadSuggestions}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Task Suggestions</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No suggestions available</p>
          <p className="text-xs mt-1">Create some tasks to get AI-powered suggestions</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Task Suggestions</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {suggestion.description}
                </p>
                {suggestion.reason && (
                  <p className="text-xs text-gray-500 italic mb-2">
                    💡 {suggestion.reason}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateTask(suggestion)}
                className="ml-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(suggestion.priority)}>
                {suggestion.priority}
              </Badge>
              {suggestion.estimated_duration && (
                <span className="text-xs text-gray-500">
                  ~{suggestion.estimated_duration} min
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Showing 5 of {suggestions.length} suggestions
          </p>
        </div>
      )}

      {/* AI Create Tasks Dialog */}
      <AICreateTasksDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        projects={projects}
        userId={userId}
        initialSuggestion={selectedSuggestion ? {
          title: selectedSuggestion.title,
          description: selectedSuggestion.description,
          priority: selectedSuggestion.priority,
          estimated_duration: selectedSuggestion.estimated_duration,
        } : null}
        onTasksCreated={() => {
          // Reload suggestions after tasks are created
          hasLoadedRef.current = false
          loadSuggestions()
          setSelectedSuggestion(null)
        }}
      />
    </Card>
  )
}

