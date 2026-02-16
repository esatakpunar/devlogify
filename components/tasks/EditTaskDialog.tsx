'use client'

import { useState, useEffect } from 'react'
import { updateTask } from '@/lib/supabase/queries/tasks'
import { notifyTaskAssigned, notifyTaskStatusChanged, notifyReviewRequested } from '@/lib/notifications/triggers'
import { logActivity } from '@/lib/supabase/queries/activities'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimeProgressIndicator } from './TimeProgressIndicator'
import { Slider } from '@/components/ui/slider'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { UserPicker } from '@/components/shared/UserPicker'
import { ReviewPanel } from '@/components/tasks/ReviewPanel'
import { useCompanyStore } from '@/lib/store/companyStore'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'

type Task = {
  id: string
  task_number: number
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
  sprint_id?: string | null
  assignee_id?: string | null
  responsible_id?: string | null
  review_status?: 'pending' | 'approved' | 'rejected' | 'changes_requested' | null
  review_note?: string | null
}

type ProjectOption = {
  id: string
  title: string
  color: string
}

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  onTaskUpdated: (task: Task) => void
  readOnly?: boolean
  companyId?: string
  userId?: string
  projects?: ProjectOption[]
  sprints?: { id: string; name: string }[]
}

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  readOnly = false,
  companyId,
  userId,
  projects = [],
  sprints = [],
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>(task.status)
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority)
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimated_duration?.toString() || '')
  const [progress, setProgress] = useState(task.progress)
  const [tags, setTags] = useState(task.tags?.join(', ') || '')
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || '')
  const [responsibleId, setResponsibleId] = useState(task.responsible_id || '')
  const [projectId, setProjectId] = useState(task.project_id)
  const [sprintId, setSprintId] = useState(task.sprint_id || 'none')
  const [loading, setLoading] = useState(false)
  const t = useTranslation()

  const isResponsible = userId && task.responsible_id === userId
  const { members, fetchMembers, company } = useCompanyStore()
  const resolvedCompanyId = companyId || (task as Task & { company_id?: string | null }).company_id || null

  // Update state when task prop changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setStatus(task.status)
    setPriority(task.priority)
    setEstimatedDuration(task.estimated_duration?.toString() || '')
    setProgress(task.progress)
    setTags(task.tags?.join(', ') || '')
    setAssigneeId(task.assignee_id || '')
    setResponsibleId(task.responsible_id || '')
    setProjectId(task.project_id)
    setSprintId(task.sprint_id || 'none')
  }, [task])

  useEffect(() => {
    if (!open || !resolvedCompanyId) return
    if (company?.id === resolvedCompanyId && members.length > 0) return
    fetchMembers(resolvedCompanyId).catch((error) => {
      console.error('Failed to fetch company members for edit dialog:', error)
    })
  }, [open, resolvedCompanyId, company?.id, members.length, fetchMembers])

  const handleProgressUpdate = (newProgress: number) => {
    // Clamp between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, newProgress))
    setProgress(clampedProgress)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) return
    setLoading(true)

    try {
      const parsedDuration = estimatedDuration ? parseInt(estimatedDuration, 10) : null
      if (parsedDuration !== null && (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 9999)) {
        toast.error('Estimated duration must be between 1 and 9999 minutes')
        setLoading(false)
        return
      }

      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
      const normalizedTags = Array.from(new Set(tagsArray))
      if (normalizedTags.length > 20) {
        toast.error('You can add at most 20 tags')
        setLoading(false)
        return
      }
      if (normalizedTags.some((tag) => tag.length > 32)) {
        toast.error('Each tag can be at most 32 characters')
        setLoading(false)
        return
      }

      const statusChanged = task.status !== status
      const movingToDone = statusChanged && status === 'done'
      const movingFromDone = statusChanged && task.status === 'done' && status !== 'done'

      const updatedTask = await updateTask(task.id, {
        title,
        project_id: projectId,
        sprint_id: sprintId === 'none' ? null : sprintId,
        description: description || null,
        status,
        priority,
        estimated_duration: parsedDuration,
        tags: normalizedTags.length > 0 ? normalizedTags : null,
        assignee_id: assigneeId || null,
        responsible_id: responsibleId || null,
        ...(movingToDone
          ? {
              completed_at: new Date().toISOString(),
              progress: 100,
              review_status: responsibleId && responsibleId !== userId ? 'pending' : null,
              review_note: null,
            }
          : movingFromDone
          ? {
              completed_at: null,
              progress: status === 'in_progress' ? 50 : 0,
              review_status: null,
              review_note: null,
            }
          : statusChanged
          ? {
              review_status: status === 'done' ? task.review_status : null,
              review_note: status === 'done' ? task.review_note : null,
            }
          : { progress }),
      })

      // If assignee changed, notify the new assignee
      const newAssigneeId = assigneeId || null
      const oldAssigneeId = task.assignee_id || null

      if (newAssigneeId && newAssigneeId !== oldAssigneeId && userId && resolvedCompanyId) {
        notifyTaskAssigned({
          taskId: task.id,
          taskTitle: title,
          projectId,
          companyId: resolvedCompanyId,
          actorId: userId,
          assigneeId: newAssigneeId,
        }).catch(err => {
          console.error('[Notification] Failed to send assignment notification:', err)
          toast.error(t('tasks.failedToSendNotification') || 'Failed to send notification')
        })
      }

      // If status changed, notify assignee and responsible
      const oldStatus = task.status
      const newStatus = status

      if (oldStatus !== newStatus && userId && resolvedCompanyId) {
        // Notify about status change
        if (assigneeId || responsibleId) {
          notifyTaskStatusChanged({
            taskId: task.id,
            taskTitle: title,
            projectId,
            companyId: resolvedCompanyId,
            actorId: userId,
            assigneeId: assigneeId || null,
            responsibleId: responsibleId || null,
            oldStatus,
            newStatus,
          }).catch(err => {
            console.error('[Notification] Failed to send status change notification:', err)
          })
        }

        // Auto-request review when marked as done
        if (
          newStatus === 'done' &&
          responsibleId &&
          responsibleId !== userId &&
          !task.review_status
        ) {
          notifyReviewRequested({
            taskId: task.id,
            taskTitle: title,
            projectId,
            companyId: resolvedCompanyId,
            actorId: userId,
            responsibleId: responsibleId,
          }).catch(err => {
            console.error('[Notification] Failed to send review request notification:', err)
          })
        }
      }

      if (userId && resolvedCompanyId && task.sprint_id !== (sprintId === 'none' ? null : sprintId)) {
        await logActivity(
          userId,
          projectId,
          task.id,
          'task_added_to_sprint',
          {
            task_title: title,
            sprint_id: sprintId === 'none' ? null : sprintId,
          },
          resolvedCompanyId
        )
      }

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
      <DialogContent className="!w-full sm:!w-[640px] lg:!w-[980px] xl:!w-[1120px] !max-w-none max-h-none sm:max-h-[95vh] h-full sm:h-auto overflow-hidden p-0 flex flex-col rounded-none sm:rounded-lg fixed top-0 left-0 right-0 bottom-0 sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{readOnly ? t('tasks.taskDetails') : t('tasks.editTask')}</span>
                <Badge
                  variant="outline"
                  className="h-6 px-2.5 text-xs font-mono font-semibold tracking-wide bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                >
                  #{task.task_number}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {readOnly ? t('tasks.viewTaskDetails') : t('tasks.updateTaskDetails')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2 sm:pb-2 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 min-h-full">
              <div className="lg:col-span-3 space-y-3 sm:space-y-4 min-w-0">
                <div className="space-y-2">
                  <Label htmlFor="edit-task-title" className="text-xs sm:text-sm">
                    {t('tasks.taskTitle')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-task-title"
                    placeholder={t('tasks.whatNeedsToBeDone')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={loading || readOnly}
                    readOnly={readOnly}
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2 min-w-0 flex-1 min-h-[350px] sm:min-h-[420px] flex flex-col">
                  <Label htmlFor="edit-task-description" className="text-xs sm:text-sm">
                    {t('projects.description')}
                  </Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder={t('tasks.addMoreDetails')}
                    className="flex-1 min-h-[350px] sm:min-h-[420px] min-w-0"
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-task-project" className="text-xs sm:text-sm">
                      {t('tasks.project')}
                    </Label>
                    <Select
                      value={projectId}
                      onValueChange={setProjectId}
                      disabled={loading || readOnly || projects.length === 0}
                    >
                      <SelectTrigger id="edit-task-project" className="w-full text-sm sm:text-base">
                        <SelectValue placeholder={t('tasks.selectProject')} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-task-status" className="text-xs sm:text-sm">
                      {t('tasks.status')}
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(value: 'todo' | 'in_progress' | 'done') => setStatus(value)}
                      disabled={loading || readOnly}
                    >
                      <SelectTrigger id="edit-task-status" className="w-full text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">{t('kanban.todo')}</SelectItem>
                        <SelectItem value="in_progress">{t('kanban.inProgress')}</SelectItem>
                        <SelectItem value="done">{t('kanban.done')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-task-sprint" className="text-xs sm:text-sm">
                      {t('kanban.sprint')}
                    </Label>
                    <Select
                      value={sprintId}
                      onValueChange={setSprintId}
                      disabled={loading || readOnly}
                    >
                      <SelectTrigger id="edit-task-sprint" className="w-full text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('kanban.noSprint')}</SelectItem>
                        {sprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-task-priority" className="text-xs sm:text-sm">
                      {t('tasks.priority')}
                    </Label>
                    <Select
                      value={priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}
                      disabled={loading || readOnly}
                    >
                      <SelectTrigger id="edit-task-priority" className="w-full text-sm sm:text-base">
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
                    <Label htmlFor="edit-task-duration" className="text-xs sm:text-sm">
                      {t('tasks.estimatedTime')}
                    </Label>
                    <Input
                      id="edit-task-duration"
                      type="number"
                      min={1}
                      max={9999}
                      placeholder="60"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      disabled={loading || readOnly}
                      readOnly={readOnly}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="edit-task-tags" className="text-xs sm:text-sm">
                      {t('tasks.tags')}
                    </Label>
                    <Input
                      id="edit-task-tags"
                      placeholder={t('tasks.tagsPlaceholder')}
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      maxLength={500}
                      disabled={loading || readOnly}
                      readOnly={readOnly}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  {members.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">{t('tasks.assignee')}</Label>
                        <UserPicker
                          members={members}
                          selectedUserId={assigneeId || null}
                          onSelect={(id) => setAssigneeId(id || '')}
                          placeholder={t('tasks.selectAssignee')}
                          disabled={loading || readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">{t('tasks.responsible')}</Label>
                        <UserPicker
                          members={members}
                          selectedUserId={responsibleId || null}
                          onSelect={(id) => setResponsibleId(id || '')}
                          placeholder={t('tasks.selectResponsible')}
                          disabled={loading || readOnly}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('tasks.progress')} % {progress}
                    </Label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Slider
                          value={[progress]}
                          onValueChange={(values) => handleProgressUpdate(values[0])}
                          min={0}
                          max={100}
                          step={20}
                          disabled={loading || readOnly}
                          className={cn(
                            "w-full",
                            progress <= 30 && "text-red-500 [&>div>div]:bg-red-500",
                            progress > 30 && progress <= 70 && "text-amber-500 [&>div>div]:bg-amber-500",
                            progress > 70 && "text-green-500 [&>div>div]:bg-green-500"
                          )}
                        />
                        <div className="flex justify-between px-1 text-xs text-gray-400 dark:text-gray-500">
                          <span>0%</span>
                          <span>20%</span>
                          <span>40%</span>
                          <span>60%</span>
                          <span>80%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tasks.timeStatus')}
                        </div>
                        <TimeProgressIndicator
                          estimatedDuration={task.estimated_duration}
                          actualDuration={task.actual_duration}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {companyId && userId && task.review_status && (
                  <ReviewPanel
                    taskId={task.id}
                    taskTitle={task.title}
                    userId={userId}
                    companyId={companyId}
                    assigneeId={task.assignee_id || null}
                    reviewStatus={task.review_status}
                    reviewNote={task.review_note || null}
                    isResponsible={!!isResponsible}
                    onReviewUpdated={() => {
                      onOpenChange(false)
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-background sticky bottom-0 z-10">
            {!readOnly && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button type="submit" disabled={loading} className="flex-1 text-xs sm:text-sm h-10 sm:h-9">
                  {loading ? t('projects.saving') : t('projects.saveChanges')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial text-xs sm:text-sm h-10 sm:h-9"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            )}
            {readOnly && (
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex-1 text-xs sm:text-sm h-10 sm:h-9"
                >
                  {t('common.close')}
                </Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
