'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { approveTask, rejectTask, requestChanges } from '@/lib/supabase/queries/tasks'
import { createNotification } from '@/lib/supabase/queries/notifications'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ReviewPanelProps {
  taskId: string
  taskTitle: string
  userId: string
  companyId: string
  assigneeId: string | null
  reviewStatus: string | null
  reviewNote: string | null
  isResponsible: boolean
  onReviewUpdated: (updates: { review_status: string; review_note: string | null }) => void
}

const reviewStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  changes_requested: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
}

export function ReviewPanel({
  taskId,
  taskTitle,
  userId,
  companyId,
  assigneeId,
  reviewStatus,
  reviewNote,
  isResponsible,
  onReviewUpdated,
}: ReviewPanelProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslation()

  const handleApprove = async () => {
    setLoading(true)
    try {
      await approveTask(taskId, userId, note || undefined)
      if (assigneeId) {
        await createNotification(
          assigneeId,
          companyId,
          'task_approved',
          t('notifications.taskApproved'),
          t('notifications.taskApprovedMessage', { title: taskTitle }),
          { task_id: taskId }
        )
      }
      onReviewUpdated({ review_status: 'approved', review_note: note || null })
      toast.success(t('tasks.taskApproved'))
      setNote('')
    } catch (error: any) {
      toast.error(error.message || t('tasks.failedToApprove'))
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await rejectTask(taskId, userId, note || undefined)
      if (assigneeId) {
        await createNotification(
          assigneeId,
          companyId,
          'task_rejected',
          t('notifications.taskRejected'),
          t('notifications.taskRejectedMessage', { title: taskTitle }),
          { task_id: taskId }
        )
      }
      onReviewUpdated({ review_status: 'rejected', review_note: note || null })
      toast.success(t('tasks.taskRejected'))
      setNote('')
    } catch (error: any) {
      toast.error(error.message || t('tasks.failedToReject'))
    } finally {
      setLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!note.trim()) {
      toast.error(t('tasks.pleaseAddNote'))
      return
    }
    setLoading(true)
    try {
      await requestChanges(taskId, userId, note)
      if (assigneeId) {
        await createNotification(
          assigneeId,
          companyId,
          'task_changes_requested',
          t('notifications.changesRequested'),
          t('notifications.changesRequestedMessage', { title: taskTitle }),
          { task_id: taskId }
        )
      }
      onReviewUpdated({ review_status: 'changes_requested', review_note: note })
      toast.success(t('tasks.changesRequested'))
      setNote('')
    } catch (error: any) {
      toast.error(error.message || t('tasks.failedToRequestChanges'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t('tasks.review')}</h4>
        {reviewStatus && (
          <Badge variant="outline" className={reviewStatusColors[reviewStatus] || ''}>
            {t(`tasks.reviewStatus.${reviewStatus}`)}
          </Badge>
        )}
      </div>

      {reviewNote && (
        <div className="text-sm text-muted-foreground bg-background rounded p-2 border">
          <p className="text-xs font-medium mb-1">{t('tasks.reviewNote')}:</p>
          {reviewNote}
        </div>
      )}

      {isResponsible && reviewStatus === 'pending' && (
        <>
          <Textarea
            placeholder={t('tasks.addReviewNote')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm min-h-[60px]"
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              {t('tasks.approve')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestChanges}
              disabled={loading}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {t('tasks.requestChanges')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={loading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-3 w-3 mr-1" />
              {t('tasks.reject')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
