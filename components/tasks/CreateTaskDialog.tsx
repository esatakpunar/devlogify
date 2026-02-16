'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/supabase/queries/tasks'
import type { Task } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
import { notifyTaskAssigned, notifyReviewRequested } from '@/lib/notifications/triggers'
import { getTaskTemplates } from '@/lib/supabase/queries/taskTemplates'
import type { TaskTemplate } from '@/lib/supabase/queries/taskTemplates'
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
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { UserPicker } from '@/components/shared/UserPicker'
import { useCompanyStore } from '@/lib/store/companyStore'
import { useUserProfileStore } from '@/lib/store/userProfileStore'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  projects?: { id: string; title: string; color: string }[]
  sprints?: { id: string; name: string }[]
  userId: string
  companyId?: string
  onTaskCreated: (task: any) => void
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  projects,
  sprints = [],
  userId,
  companyId,
  onTaskCreated
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [tags, setTags] = useState('')
  const [assigneeId, setAssigneeId] = useState<string | null>(userId)
  const [responsibleId, setResponsibleId] = useState<string | null>(userId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [selectedSprintId, setSelectedSprintId] = useState<string>('none')
  const t = useTranslation()
  const { members } = useCompanyStore()
  const { profile } = useUserProfileStore()
  const taskCompanyId = companyId || profile?.company_id || null

  // Load templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates()
      setSelectedProjectId(projectId || projects?.[0]?.id || '')
      setSelectedSprintId('none')
    }
  }, [open, userId, projectId, projects, taskCompanyId])

  const loadTemplates = async () => {
    try {
      const data = await getTaskTemplates(userId, taskCompanyId)
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    setTitle(template.title)
    setDescription(template.description || '')
    setPriority(template.priority)
    setEstimatedDuration(template.estimated_duration?.toString() || '')
    setTags(template.tags?.join(', ') || '')
    setShowTemplates(false)
  }

  const clearTemplate = () => {
    setSelectedTemplate(null)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setEstimatedDuration('')
    setTags('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
  
    try {
      const parsedDuration = estimatedDuration ? parseInt(estimatedDuration, 10) : null
      if (parsedDuration !== null && (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 9999)) {
        setError('Estimated duration must be between 1 and 9999 minutes')
        setLoading(false)
        return
      }

      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
      const normalizedTags = Array.from(new Set(tagsArray))
      if (normalizedTags.length > 20) {
        setError('You can add at most 20 tags')
        setLoading(false)
        return
      }
      if (normalizedTags.some((tag) => tag.length > 32)) {
        setError('Each tag can be at most 32 characters')
        setLoading(false)
        return
      }

      const finalProjectId = projectId || selectedProjectId
      if (!finalProjectId) {
        setError(t('tasks.projectRequired'))
        setLoading(false)
        return
      }

      const newTask = (await createTask({
        project_id: finalProjectId,
        user_id: userId,
        title,
        description: description || null,
        priority,
        estimated_duration: parsedDuration,
        status: 'todo',
        tags: normalizedTags.length > 0 ? normalizedTags : null,
        company_id: taskCompanyId,
        sprint_id: selectedSprintId === 'none' ? null : selectedSprintId,
        assignee_id: assigneeId,
        responsible_id: responsibleId,
      })) as Task
  
      // Activity log ekle
      await logActivity(
        userId,
        finalProjectId,
        newTask.id,
        'task_created',
        { task_title: title },
        taskCompanyId
      )

      if (selectedSprintId !== 'none') {
        await logActivity(
          userId,
          finalProjectId,
          newTask.id,
          'task_added_to_sprint',
          { task_title: title, sprint_id: selectedSprintId },
          taskCompanyId
        )
      }

      // Send notification to assignee (includes email)
      if (assigneeId && taskCompanyId) {
        notifyTaskAssigned({
          taskId: newTask.id,
          taskTitle: title,
          projectId: finalProjectId,
          companyId: taskCompanyId,
          actorId: userId,
          assigneeId,
        }).catch(err => console.error('Failed to create assignment notification:', err))
      }

      // Send notification to responsible (includes email)
      if (responsibleId && responsibleId !== assigneeId && taskCompanyId) {
        notifyReviewRequested({
          taskId: newTask.id,
          taskTitle: title,
          projectId: finalProjectId,
          companyId: taskCompanyId,
          actorId: userId,
          responsibleId,
        }).catch(err => console.error('Failed to create responsible notification:', err))
      }

      onTaskCreated(newTask)
      
      // Reset form
      setTitle('')
      setDescription('')
      setPriority('medium')
      setEstimatedDuration('')
      setTags('')
      setAssigneeId(userId)
      setResponsibleId(userId)
      setSelectedTemplate(null)
      setSelectedProjectId(projectId || projects?.[0]?.id || '')
      setSelectedSprintId('none')
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-full sm:!w-[600px] lg:!w-[900px] !max-w-none max-h-none sm:max-h-[95vh] h-full sm:h-auto overflow-hidden p-0 flex flex-col rounded-none sm:rounded-lg fixed top-0 left-0 right-0 bottom-0 sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
            <DialogHeader>
              <DialogTitle>{t('tasks.createNewTask')}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t('tasks.addNewTaskToProject')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 min-h-0">
            <div className="space-y-3 sm:space-y-4 min-w-0">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2.5 sm:p-3 rounded-md text-xs sm:text-sm">
              {error}
            </div>
          )}

          {projects && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task-project" className="text-xs sm:text-sm">
                {t('tasks.project')} <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loading}>
                <SelectTrigger id="task-project" className="text-sm sm:text-base">
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
          )}

          <div className="space-y-2">
            <Label htmlFor="task-sprint" className="text-xs sm:text-sm">
              {t('kanban.sprint')}
            </Label>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId} disabled={loading}>
              <SelectTrigger id="task-sprint" className="text-sm sm:text-base">
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

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs sm:text-sm">{t('tasks.quickStartFromTemplate')}</Label>
                {!showTemplates && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    className="text-xs sm:text-sm h-7 sm:h-8"
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('tasks.browseTemplates')}</span>
                    <span className="sm:hidden">{t('tasks.browseTemplates')}</span>
                  </Button>
                )}
              </div>
              
              {showTemplates && (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium">{t('tasks.selectATemplate')}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(false)}
                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className="text-left p-2.5 sm:p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{template.title}</div>
                            {template.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {template.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                            {template.priority}
                          </Badge>
                        </div>
                        {template.estimated_duration && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            ~{template.estimated_duration} min
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate && (
                <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">
                    {t('tasks.usingTemplate')} <strong>{selectedTemplate.title}</strong>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearTemplate}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-xs sm:text-sm">
              {t('tasks.taskTitle')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder={t('tasks.whatNeedsToBeDone')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2 min-w-0 flex-1 min-h-[350px] flex flex-col">
            <Label htmlFor="task-description" className="text-xs sm:text-sm">{t('projects.description')}</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={t('tasks.addMoreDetails')}
              className="flex-1 min-h-[350px] sm:min-h-[400px] min-w-0"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[auto_auto_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority" className="text-xs sm:text-sm">{t('tasks.priority')}</Label>
              <Select 
                value={priority} 
                onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}
                disabled={loading}
              >
                <SelectTrigger id="task-priority" className="text-sm sm:text-base lg:w-[140px]">
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
              <Label htmlFor="task-duration" className="text-xs sm:text-sm">{t('tasks.estimatedTime')}</Label>
              <Input
                id="task-duration"
                type="number"
                min={1}
                max={9999}
                placeholder="60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                disabled={loading}
                className="text-sm sm:text-base lg:w-[140px]"
              />
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="task-tags" className="text-xs sm:text-sm">{t('tasks.tags')}</Label>
              <Input
                id="task-tags"
                placeholder={t('tasks.tagsPlaceholder')}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                maxLength={500}
                disabled={loading}
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Assignee & Responsible */}
          {members.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">{t('tasks.assignee')}</Label>
                <UserPicker
                  members={members}
                  selectedUserId={assigneeId}
                  onSelect={setAssigneeId}
                  placeholder={t('tasks.selectAssignee')}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">{t('tasks.responsible')}</Label>
                <UserPicker
                  members={members}
                  selectedUserId={responsibleId}
                  onSelect={setResponsibleId}
                  placeholder={t('tasks.selectResponsible')}
                  disabled={loading}
                />
              </div>
            </div>
          )}
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-background sticky bottom-0 z-10">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button type="submit" disabled={loading} className="flex-1 text-xs sm:text-sm h-10 sm:h-9">
                {loading ? t('tasks.creatingTask') : t('tasks.createTask')}
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
