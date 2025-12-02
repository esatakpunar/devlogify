'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Plus, Loader2, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AICreateTasksDialog } from '@/components/tasks/AICreateTasksDialog'
import { getProjects } from '@/lib/supabase/queries/projects'
import { usePremium } from '@/lib/hooks/usePremium'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
  const t = useTranslation()
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
        throw new Error(errorData.error || t('dashboard.taskSuggestions.failedToLoad'))
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (err: any) {
      console.error('Error loading suggestions:', err)
      setError(err.message || t('dashboard.taskSuggestions.failedToLoad'))
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
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.taskSuggestions.title')}</h3>
        </div>
        <div className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.taskSuggestions.title')}</h3>
        </div>
        <div className="text-center py-6 sm:py-8">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadSuggestions} className="text-xs sm:text-sm">
            {t('common.tryAgain')}
          </Button>
        </div>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.taskSuggestions.title')}</h3>
        </div>
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-xs sm:text-sm">{t('dashboard.taskSuggestions.noSuggestionsAvailable')}</p>
          <p className="text-xs mt-1">{t('dashboard.taskSuggestions.createTasksToGetSuggestions')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.taskSuggestions.title')}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSuggestions} disabled={loading} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
          <span className="sr-only">{t('common.refresh')}</span>
          <Loader2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <div
            key={index}
            className="p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs sm:text-sm mb-1 dark:text-gray-200">{suggestion.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2 line-clamp-2">
                  {suggestion.description}
                </p>
                {suggestion.reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-1.5 sm:mb-2 line-clamp-1">
                    💡 {suggestion.reason}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateTask(suggestion)}
                className="ml-1 sm:ml-2 h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge className={`${getPriorityColor(suggestion.priority)} text-xs`}>
                {t(`common.${suggestion.priority}`)}
              </Badge>
              {suggestion.estimated_duration && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ~{suggestion.estimated_duration} {t('common.min')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 5 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('dashboard.taskSuggestions.showingSuggestions', { count: suggestions.length })}
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

