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
import { TimeProgressIndicator } from './TimeProgressIndicator'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'

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
  onTaskUpdated: (task: Task) => void
}

export function EditTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
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
    // Clamp between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, newProgress))
    setProgress(clampedProgress)
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
            <Label className="text-sm font-medium text-gray-700">
              {t('tasks.progress')} % {progress}
            </Label>
            <div className="space-y-4">
              {/* Radix Slider */}
              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  onValueChange={(values) => handleProgressUpdate(values[0])}
                  min={0}
                  max={100}
                  step={20}
                  disabled={loading}
                  className={cn(
                    "w-full",
                    progress <= 30 && "text-red-500 [&>div>div]:bg-red-500",
                    progress > 30 && progress <= 70 && "text-amber-500 [&>div>div]:bg-amber-500",
                    progress > 70 && "text-green-500 [&>div>div]:bg-green-500"
                  )}
                />
                {/* Tick marks */}
                <div className="flex justify-between px-1 text-xs text-gray-400">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                  <span>60%</span>
                  <span>80%</span>
                  <span>100%</span>
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}