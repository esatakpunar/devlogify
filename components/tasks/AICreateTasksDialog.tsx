'use client'

import { useState, useEffect } from 'react'
import { type AITask } from '@/lib/ai/gemini'
import { createTasks } from '@/lib/supabase/queries/tasks'
import { getProject } from '@/lib/supabase/queries/projects'
import type { Project as DbProject } from '@/lib/supabase/queries/projects'
import { logActivity } from '@/lib/supabase/queries/activities'
import type { TaskInsert } from '@/lib/supabase/queries/tasks'
import type { Task } from '@/lib/supabase/queries/tasks'
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
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, Trash2, Plus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Project {
  id: string
  title: string
  color: string
}

interface Note {
  id: string
  title: string | null
  content: string
}

interface AICreateTasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  userId: string
  companyId?: string
  initialNote?: Note | null
  initialSuggestion?: {
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    estimated_duration?: number
  } | null
  onTasksCreated?: (tasks: any[]) => void
}

interface EditableTask extends AITask {
  id: string // Temporary ID for editing
}

export function AICreateTasksDialog({
  open,
  onOpenChange,
  projects,
  userId,
  companyId,
  initialNote,
  initialSuggestion,
  onTasksCreated,
}: AICreateTasksDialogProps) {
  const t = useTranslation()
  const [notesInput, setNotesInput] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [tasks, setTasks] = useState<EditableTask[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input')

  // Load initial note or suggestion if provided and auto-select project
  useEffect(() => {
    if (open) {
      // Auto-select project if only one project is available
      if (projects.length === 1 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id)
      }

      if (initialNote) {
        setNotesInput(initialNote.content)
        if (initialNote.title) {
          setNotesInput(`${initialNote.title}\n\n${initialNote.content}`)
        }
      } else if (initialSuggestion) {
        // Pre-fill with suggestion
        const suggestionText = `${initialSuggestion.title}\n\n${initialSuggestion.description}`
        setNotesInput(suggestionText)
        // Auto-select first project if available
        if (projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projects[0].id)
        }
      }
    }
  }, [initialNote, initialSuggestion, open, projects, selectedProjectId])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setNotesInput('')
      setSelectedProjectId('')
      setTasks([])
      setError(null)
      setActiveTab('input')
    }
  }, [open])

  const handleGenerateTasks = async () => {
    if (!notesInput.trim()) {
      setError(t('tasks.aiCreateTasks.pleaseEnterNotes'))
      return
    }

    if (!selectedProjectId) {
      setError(t('tasks.aiCreateTasks.pleaseSelectProject'))
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Call server-side API route
      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesInput }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('tasks.aiCreateTasks.failedToGenerate'))
      }

      const data = await response.json()
      const generatedTasks: AITask[] = data.tasks || []
      
      // Add temporary IDs for editing
      const tasksWithIds: EditableTask[] = generatedTasks.map((task, index) => ({
        ...task,
        id: `temp-${Date.now()}-${index}`,
      }))

      setTasks(tasksWithIds)
      setActiveTab('preview')
      
      if (tasksWithIds.length === 0) {
        toast.info(t('tasks.aiCreateTasks.noTasksExtracted'))
      } else {
        toast.success(t('tasks.aiCreateTasks.generatedTasks', { count: tasksWithIds.length }))
      }
    } catch (err: any) {
      console.error('Error generating tasks:', err)
      setError(err.message || t('tasks.aiCreateTasks.failedToGenerate'))
      toast.error(err.message || t('tasks.aiCreateTasks.failedToGenerate'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTaskChange = (taskId: string, field: keyof AITask, value: any) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ))
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const handleAddTask = () => {
    const newTask: EditableTask = {
      id: `temp-${Date.now()}-${tasks.length}`,
      title: '',
      description: '',
      priority: 'medium',
      estimated_duration: undefined,
    }
    setTasks([...tasks, newTask])
  }

  const handleCreateTasks = async () => {
    if (tasks.length === 0) {
      setError(t('tasks.aiCreateTasks.noTasksToCreate'))
      return
    }

    if (!selectedProjectId) {
      setError(t('tasks.aiCreateTasks.pleaseSelectProject'))
      return
    }

    // Validate all tasks have titles and descriptions
    const invalidTasks = tasks.filter(task => !task.title.trim() || !task.description?.trim())
    if (invalidTasks.length > 0) {
      setError(t('tasks.aiCreateTasks.allTasksMustHaveTitleAndDescription'))
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      let resolvedCompanyId = companyId || null
      if (!resolvedCompanyId && selectedProjectId) {
        try {
          const selectedProject = (await getProject(selectedProjectId)) as DbProject
          resolvedCompanyId = selectedProject?.company_id || null
        } catch (projectError) {
          console.error('Error resolving project company id:', projectError)
        }
      }

      // Convert to TaskInsert format
      const tasksToInsert: TaskInsert[] = tasks.map((task, index) => ({
        project_id: selectedProjectId,
        user_id: userId,
        company_id: resolvedCompanyId,
        title: task.title.trim(),
        description: task.description.trim() || null, // Description is required but can be stored as null in DB if needed
        priority: task.priority,
        estimated_duration: task.estimated_duration || null,
        status: 'todo',
        assignee_id: userId,
        order_index: index,
        progress: 0,
        actual_duration: 0,
      }))

      // Create tasks in batch
      const createdTasks = (await createTasks(tasksToInsert)) as Task[]

      // Log activities for each task
      for (const task of createdTasks) {
        await logActivity(
          userId,
          selectedProjectId,
          task.id,
          'task_created',
          { task_title: task.title, source: 'ai_generated' },
          resolvedCompanyId
        )
      }

      toast.success(t('tasks.aiCreateTasks.successfullyCreated', { count: createdTasks.length }))
      
      if (onTasksCreated) {
        onTasksCreated(createdTasks)
      }

      // Reset and close
      setTasks([])
      setNotesInput('')
      setSelectedProjectId('')
      onOpenChange(false)
    } catch (err: any) {
      console.error('Error creating tasks:', err)
      setError(err.message || t('tasks.aiCreateTasks.failedToCreate'))
      toast.error(err.message || t('tasks.aiCreateTasks.failedToCreate'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[1000px] h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 gap-0 flex flex-col">
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-3 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              {t('tasks.aiCreateTasks.title')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {t('tasks.aiCreateTasks.description')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 min-h-0">
          <div className="space-y-4 pb-4 sm:pb-5 min-w-0">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2.5 sm:p-3 rounded-md text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Project Selection - Only show if multiple projects available */}
            {projects.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="project-select" className="text-xs sm:text-sm">
                  {t('tasks.aiCreateTasks.project')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={isGenerating || isCreating}
                >
                  <SelectTrigger id="project-select" className="text-sm sm:text-base">
                    <SelectValue placeholder={t('tasks.aiCreateTasks.selectProject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'input' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                <TabsTrigger value="input" className="text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">{t('tasks.aiCreateTasks.inputNotes')}</span>
                  <span className="sm:hidden">Input</span>
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={tasks.length === 0} className="text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">{t('tasks.aiCreateTasks.previewTasks')}</span>
                  <span className="sm:hidden">Preview</span>
                  {tasks.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 h-4">{tasks.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="space-y-2">
                  <Label htmlFor="notes-input" className="text-xs sm:text-sm">
                    {t('tasks.aiCreateTasks.notesOrText')} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="notes-input"
                    placeholder={t('tasks.aiCreateTasks.notesPlaceholder')}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    rows={4}
                    disabled={isGenerating || isCreating}
                    className="font-mono text-xs sm:text-sm resize-none"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {t('tasks.aiCreateTasks.aiWillAnalyze')}
                  </p>
                </div>

                <Button
                  onClick={handleGenerateTasks}
                  disabled={!notesInput.trim() || !selectedProjectId || isGenerating || isCreating}
                  className="w-full text-xs sm:text-sm h-9 sm:h-10"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">{t('tasks.aiCreateTasks.generatingTasks')}</span>
                      <span className="sm:hidden">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('tasks.aiCreateTasks.generateTasks')}</span>
                      <span className="sm:hidden">Generate</span>
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="preview" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    {t('tasks.aiCreateTasks.noTasksGenerated')}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 flex-shrink-0">
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                        {t('tasks.aiCreateTasks.reviewAndEdit')}
                      </p>
                      <Button
                        onClick={handleAddTask}
                        variant="outline"
                        size="sm"
                        disabled={isCreating}
                        className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">{t('tasks.aiCreateTasks.addTask')}</span>
                      </Button>
                    </div>

                    <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-280px)] sm:max-h-none overflow-y-auto pr-1">
                      {tasks.map((task, index) => (
                        <Card key={task.id} className="p-3 sm:p-4 border-gray-200 dark:border-gray-800">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {t('tasks.aiCreateTasks.taskNumber', { number: index + 1 })}
                              </span>
                              <Button
                                onClick={() => handleDeleteTask(task.id)}
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                                disabled={isCreating}
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <Label className="text-[10px] sm:text-xs">{t('tasks.title')} *</Label>
                                <Input
                                  value={task.title}
                                  onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                                  placeholder={t('tasks.aiCreateTasks.taskTitle')}
                                  disabled={isCreating}
                                  className="mt-1 text-xs sm:text-sm h-8 sm:h-9"
                                />
                              </div>

                              <div className="min-h-[200px] flex flex-col min-w-0">
                                <Label className="text-[10px] sm:text-xs">{t('tasks.description')} <span className="text-red-500">*</span></Label>
                                <div className="mt-1 flex-1 min-h-[180px] min-w-0">
                                  <RichTextEditor
                                    value={task.description || ''}
                                    onChange={(value) => handleTaskChange(task.id, 'description', value)}
                                    placeholder={t('tasks.aiCreateTasks.provideContext')}
                                    className="min-h-[180px] min-w-0"
                                    readOnly={isCreating}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] sm:text-xs">{t('tasks.priority')}</Label>
                                  <Select
                                    value={task.priority}
                                    onValueChange={(value: 'low' | 'medium' | 'high') =>
                                      handleTaskChange(task.id, 'priority', value)
                                    }
                                    disabled={isCreating}
                                  >
                                    <SelectTrigger className="mt-1 text-xs sm:text-sm h-8 sm:h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">{t('common.low')}</SelectItem>
                                      <SelectItem value="medium">{t('common.medium')}</SelectItem>
                                      <SelectItem value="high">{t('common.high')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-[10px] sm:text-xs">{t('tasks.estimatedDuration')}</Label>
                                  <Input
                                    type="number"
                                    value={task.estimated_duration || ''}
                                    onChange={(e) =>
                                      handleTaskChange(
                                        task.id,
                                        'estimated_duration',
                                        e.target.value ? parseInt(e.target.value) : undefined
                                      )
                                    }
                                    placeholder="60"
                                    disabled={isCreating}
                                    className="mt-1 text-xs sm:text-sm h-8 sm:h-9"
                                    min="0"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sticky Footer for Preview Tab */}
        {activeTab === 'preview' && tasks.length > 0 && (
          <div className="px-3 sm:px-6 pt-4 pb-4 sm:pb-5 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-background sticky bottom-0 z-10">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleCreateTasks}
                disabled={tasks.length === 0 || isCreating || tasks.some(task => !task.title.trim() || !task.description?.trim())}
                className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">{t('tasks.aiCreateTasks.creatingTasks')}</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('tasks.aiCreateTasks.createTasks', { count: tasks.length })}</span>
                    <span className="sm:hidden">Create {tasks.length}</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTasks([])
                  setActiveTab('input')
                }}
                disabled={isCreating}
                className="flex-1 sm:flex-initial text-xs sm:text-sm h-9 sm:h-10"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
