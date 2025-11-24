'use client'

import { useState, useEffect } from 'react'
import { updateTask } from '@/lib/supabase/queries/tasks'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProgressBar } from '@/components/ui/progress-bar'
import { TimeProgressIndicator } from './TimeProgressIndicator'
import { TaskTemplateDialog } from './TaskTemplateDialog'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimated_duration: number | null
  actual_duration: number
  progress: number
  order_index: number
  created_at: string
  tags?: string[] | null
}

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  userId: string
  onTaskUpdated: (task: Task) => void
}

export function EditTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  userId,
  onTaskUpdated 
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority)
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimated_duration?.toString() || '')
  const [progress, setProgress] = useState(task.progress)
  const [tags, setTags] = useState(task.tags?.join(', ') || '')
  const [loading, setLoading] = useState(false)
  const t = useTranslation()

  // Update state when task prop changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setEstimatedDuration(task.estimated_duration?.toString() || '')
    setProgress(task.progress)
    setTags(task.tags?.join(', ') || '')
  }, [task])

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const updatedTask = await updateTask(task.id, {
        title,
        description: description || null,
        priority,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
        progress,
        tags: tagsArray.length > 0 ? tagsArray : null,
      })

      onTaskUpdated(updatedTask)
      toast.success(t('tasks.taskUpdatedSuccessfully'))
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to update task:', error)
      toast.error(t('tasks.failedToUpdateTask'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('tasks.editTask')}</DialogTitle>
          <DialogDescription>
            {t('tasks.updateTaskDetails')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">
              {t('tasks.taskTitle')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-task-title"
              placeholder={t('tasks.whatNeedsToBeDone')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="edit-task-description">{t('projects.description')}</Label>
            <Textarea
              id="edit-task-description"
              placeholder={t('tasks.addMoreDetails')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="resize-none break-words overflow-wrap-anywhere w-full max-w-full h-40 overflow-y-auto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-priority">{t('tasks.priority')}</Label>
              <Select 
                value={priority} 
                onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}
                disabled={loading}
              >
                <SelectTrigger id="edit-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('common.low')}</SelectItem>
                  <SelectItem value="medium">{t('common.medium')}</SelectItem>
                  <SelectItem value="high">{t('common.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-duration">{t('tasks.estimatedTime')}</Label>
              <Input
                id="edit-task-duration"
                type="number"
                placeholder="60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="edit-task-tags">{t('tasks.tags')}</Label>
            <Input
              id="edit-task-tags"
              placeholder={t('tasks.tagsPlaceholder')}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">{t('tasks.separateTagsWithCommas')}</p>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <Label>{t('tasks.progress')}</Label>
            <div className="space-y-3">
              {/* Interactive Progress Bar */}
              <div className="space-y-2">
                <ProgressBar 
                  value={progress} 
                  showPercentage 
                  size="md" 
                  interactive={true}
                  onValueChange={handleProgressUpdate}
                />
                <div className="text-xs text-gray-500">
                  {t('tasks.clickProgressBarToSet')}
                </div>
              </div>
              
              {/* Time Progress Indicator */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">{t('tasks.timeStatus')}</div>
                <TimeProgressIndicator
                  estimatedDuration={task.estimated_duration}
                  actualDuration={task.actual_duration}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('projects.saving') : t('projects.saveChanges')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <TaskTemplateDialog
              userId={userId}
              initialTask={{
                title,
                description: description || null,
                priority,
                estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
              }}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}