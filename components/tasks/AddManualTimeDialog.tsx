'use client'

import { useState } from 'react'
import { addManualTimeEntry } from '@/lib/supabase/queries/time_entries'
import { logTimeActivity } from '@/lib/supabase/queries/activities'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface AddManualTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  userId: string
  companyId?: string
  onTimeAdded: (minutes: number) => void
}

export function AddManualTimeDialog({ 
  open, 
  onOpenChange, 
  taskId,
  taskTitle,
  userId,
  companyId,
  onTimeAdded 
}: AddManualTimeDialogProps) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0')

    if (totalMinutes <= 0) {
      toast.error(t('timeLogging.pleaseEnterValidTime'))
      return
    }

    setLoading(true)

    try {
      // Add manual time entry and update task duration
      const { projectId, companyId: resolvedCompanyId } = await addManualTimeEntry(
        taskId,
        userId,
        totalMinutes,
        note || undefined
      )

      // Log activity
      await logTimeActivity(
        userId,
        projectId,
        taskId,
        totalMinutes,
        taskTitle,
        true,
        companyId || resolvedCompanyId || null
      )

      onTimeAdded(totalMinutes)
      toast.success(t('timeLogging.timeLoggedSuccessfully'), {
        description: t('timeLogging.addedMinutesTo', { minutes: totalMinutes, title: taskTitle }),
      })

      // Reset form
      setHours('')
      setMinutes('')
      setNote('')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to add time:', error)
      toast.error(t('timeLogging.failedToLogTime'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t('timeLogging.logTimeManually')}</DialogTitle>
          <DialogDescription>
            {t('timeLogging.addTimeSpentOn')} <span className="font-medium text-gray-900">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">{t('timeLogging.hours')}</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                placeholder="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">{t('timeLogging.minutes')}</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('timeLogging.noteOptional')}</Label>
            <Textarea
              id="note"
              placeholder={t('timeLogging.whatDidYouWorkOn')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              {loading ? t('timeLogging.logging') : t('timeLogging.logTime')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
