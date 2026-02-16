'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { getActivities } from '@/lib/supabase/queries/activities'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Activity,
  ChevronDown,
  Loader2,
  CheckCircle,
  PlusCircle,
  Clock,
  Folder,
  FileText,
  Users,
  ArrowRight,
  Star,
} from 'lucide-react'

interface ActivityLogsProps {
  companyId: string
}

interface ActivityLog {
  id: string
  user_id: string
  project_id: string | null
  task_id: string | null
  action_type: string
  metadata: Record<string, any>
  company_id: string | null
  created_at: string
  project: { id: string; title: string; color: string } | null
  task: { id: string; title: string; task_number: number } | null
  user: { id: string; full_name: string | null; avatar_url: string | null; email: string } | null
}

const PAGE_SIZE = 20

export function ActivityLogs({ companyId }: ActivityLogsProps) {
  const t = useTranslation()

  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadActivities = useCallback(async (currentOffset: number, append: boolean = false) => {
    try {
      const data = await getActivities(companyId, PAGE_SIZE, currentOffset)
      const typed = data as ActivityLog[]

      if (append) {
        setActivities((prev) => [...prev, ...typed])
      } else {
        setActivities(typed)
      }

      setHasMore(typed.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Failed to load activities')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  useEffect(() => {
    setIsLoading(true)
    loadActivities(0).finally(() => setIsLoading(false))
  }, [loadActivities])

  const handleLoadMore = async () => {
    const newOffset = offset + PAGE_SIZE
    setIsLoadingMore(true)
    await loadActivities(newOffset, true)
    setOffset(newOffset)
    setIsLoadingMore(false)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'task_created':
        return <PlusCircle className="w-4 h-4 text-green-500" />
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'task_status_changed':
        return <ArrowRight className="w-4 h-4 text-blue-500" />
      case 'task_progress_updated':
      case 'task_progress_milestone':
        return <Star className="w-4 h-4 text-amber-500" />
      case 'task_assigned':
      case 'task_review_requested':
      case 'task_approved':
      case 'task_rejected':
      case 'task_changes_requested':
        return <Users className="w-4 h-4 text-purple-500" />
      case 'time_logged':
        return <Clock className="w-4 h-4 text-indigo-500" />
      case 'project_created':
      case 'project_updated':
      case 'project_deleted':
        return <Folder className="w-4 h-4 text-orange-500" />
      case 'note_created':
        return <FileText className="w-4 h-4 text-cyan-500" />
      case 'member_joined':
      case 'member_removed':
      case 'team_created':
      case 'team_updated':
      case 'sprint_created':
      case 'sprint_started':
      case 'sprint_closed':
      case 'task_added_to_sprint':
        return <Users className="w-4 h-4 text-pink-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getActionDescription = (activity: ActivityLog) => {
    const userName = activity.user?.full_name || activity.user?.email || t('company.unknownUser')
    const metadata = activity.metadata || {}
    const formattedTask =
      metadata.task_title ||
      (activity.task ? `#${activity.task.task_number} ${activity.task.title}` : '')

    switch (activity.action_type) {
      case 'task_created':
        return t('company.activity_taskCreated', {
          user: userName,
          task: formattedTask,
        })
      case 'task_completed':
        return t('company.activity_taskCompleted', {
          user: userName,
          task: formattedTask,
        })
      case 'task_status_changed':
        return t('company.activity_taskStatusChanged', {
          user: userName,
          task: formattedTask,
          status: metadata.new_status || '',
        })
      case 'task_progress_updated':
        return t('company.activity_taskProgressUpdated', {
          user: userName,
          task: formattedTask,
          progress: metadata.new_progress || 0,
        })
      case 'task_progress_milestone':
        return t('company.activity_taskProgressMilestone', {
          user: userName,
          task: formattedTask,
          progress: metadata.new_progress || 0,
        })
      case 'time_logged':
        return t('company.activity_timeLogged', {
          user: userName,
          duration: metadata.duration || 0,
          task: formattedTask,
        })
      case 'project_created':
        return t('company.activity_projectCreated', {
          user: userName,
          project: metadata.project_title || activity.project?.title || '',
        })
      case 'project_updated':
        return t('company.activity_projectUpdated', {
          user: userName,
          project: metadata.project_title || activity.project?.title || '',
        })
      case 'project_deleted':
        return t('company.activity_projectDeleted', {
          user: userName,
          project: metadata.project_title || '',
        })
      case 'note_created':
        return t('company.activity_noteCreated', { user: userName })
      case 'member_joined':
        return t('company.activity_memberJoined', { user: userName })
      case 'member_removed':
        return t('company.activity_memberRemoved', { user: userName })
      case 'team_created':
        return t('company.activity_teamCreated', {
          user: userName,
          team: metadata.team_name || '',
        })
      case 'team_updated':
        return t('company.activity_teamUpdated', {
          user: userName,
          team: metadata.team_name || '',
        })
      case 'task_assigned':
        return t('company.activity_taskAssigned', {
          user: userName,
          task: formattedTask,
        })
      case 'task_review_requested':
        return t('company.activity_taskReviewRequested', {
          user: userName,
          task: formattedTask,
        })
      case 'task_approved':
        return t('company.activity_taskApproved', {
          user: userName,
          task: formattedTask,
        })
      case 'task_rejected':
        return t('company.activity_taskRejected', {
          user: userName,
          task: formattedTask,
        })
      case 'task_changes_requested':
        return t('company.activity_taskChangesRequested', {
          user: userName,
          task: formattedTask,
        })
      case 'sprint_created':
        return `${userName} created sprint "${metadata.sprint_name || ''}"`
      case 'sprint_started':
        return `${userName} started sprint "${metadata.sprint_name || ''}"`
      case 'sprint_closed':
        return `${userName} closed sprint "${metadata.sprint_name || ''}"`
      case 'task_added_to_sprint':
        return `${userName} added ${formattedTask || 'a task'} to a sprint`
      default:
        return t('company.activity_generic', {
          user: userName,
          action: activity.action_type.replace(/_/g, ' '),
        })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return t('company.justNow')
    if (diffMinutes < 60) return t('company.minutesAgo', { count: diffMinutes })
    if (diffHours < 24) return t('company.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('company.daysAgo', { count: diffDays })

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t('company.noActivity')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => (
        <div key={activity.id}>
          <div className="flex items-start gap-3 py-3">
            {/* User Avatar */}
            <Tooltip content={activity.user?.full_name || activity.user?.email || '?'}>
              <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                {activity.user?.avatar_url ? (
                  <AvatarImage src={activity.user.avatar_url} alt={activity.user.full_name || ''} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {activity.user
                    ? getInitials(activity.user.full_name, activity.user.email)
                    : '?'}
                </AvatarFallback>
              </Avatar>
            </Tooltip>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">{getActionIcon(activity.action_type)}</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  {getActionDescription(activity)}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1 ml-6">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatTimeAgo(activity.created_at)}
                </span>
                {activity.project && (
                  <Badge variant="outline" className="text-xs py-0 px-1.5">
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: activity.project.color }}
                    />
                    {activity.project.title}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {index < activities.length - 1 && <Separator />}
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-2" />
            )}
            {t('company.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}
