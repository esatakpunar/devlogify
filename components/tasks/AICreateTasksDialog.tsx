'use client'

import { useState, useEffect } from 'react'
import { type AITask } from '@/lib/ai/gemini'
import { createTasks } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
import type { TaskInsert } from '@/lib/supabase/queries/tasks'
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

  // Load initial note or suggestion if provided
  useEffect(() => {
    if (open) {
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
      // Convert to TaskInsert format
      const tasksToInsert: TaskInsert[] = tasks.map((task, index) => ({
        project_id: selectedProjectId,
        user_id: userId,
        title: task.title.trim(),
        description: task.description.trim() || null, // Description is required but can be stored as null in DB if needed
        priority: task.priority,
        estimated_duration: task.estimated_duration || null,
        status: 'todo',
        order_index: index,
        progress: 0,
        actual_duration: 0,
      }))

      // Create tasks in batch
      const createdTasks = await createTasks(tasksToInsert)

      // Log activities for each task
      for (const task of createdTasks) {
        await logActivity(
          userId,
          selectedProjectId,
          task.id,
          'task_created',
          { task_title: task.title, source: 'ai_generated' }
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {t('tasks.aiCreateTasks.title')}
          </DialogTitle>
          <DialogDescription>
            {t('tasks.aiCreateTasks.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project-select">
              {t('tasks.aiCreateTasks.project')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isGenerating || isCreating}
            >
              <SelectTrigger id="project-select">
                <SelectValue placeholder={t('tasks.aiCreateTasks.selectProject')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'input' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">{t('tasks.aiCreateTasks.inputNotes')}</TabsTrigger>
              <TabsTrigger value="preview" disabled={tasks.length === 0}>
                {t('tasks.aiCreateTasks.previewTasks')} {tasks.length > 0 && `(${tasks.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes-input">
                  {t('tasks.aiCreateTasks.notesOrText')} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="notes-input"
                  placeholder={t('tasks.aiCreateTasks.notesPlaceholder')}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={10}
                  disabled={isGenerating || isCreating}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  {t('tasks.aiCreateTasks.aiWillAnalyze')}
                </p>
              </div>

              <Button
                onClick={handleGenerateTasks}
                disabled={!notesInput.trim() || !selectedProjectId || isGenerating || isCreating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('tasks.aiCreateTasks.generatingTasks')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('tasks.aiCreateTasks.generateTasks')}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('tasks.aiCreateTasks.noTasksGenerated')}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {t('tasks.aiCreateTasks.reviewAndEdit')}
                    </p>
                    <Button
                      onClick={handleAddTask}
                      variant="outline"
                      size="sm"
                      disabled={isCreating}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('tasks.aiCreateTasks.addTask')}
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {tasks.map((task, index) => (
                      <Card key={task.id} className="p-4 border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-gray-500">
                              {t('tasks.aiCreateTasks.taskNumber', { number: index + 1 })}
                            </span>
                            <Button
                              onClick={() => handleDeleteTask(task.id)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={isCreating}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">{t('tasks.title')} *</Label>
                              <Input
                                value={task.title}
                                onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                                placeholder={t('tasks.aiCreateTasks.taskTitle')}
                                disabled={isCreating}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">{t('tasks.description')} <span className="text-red-500">*</span></Label>
                              <Textarea
                                value={task.description || ''}
                                onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                                placeholder={t('tasks.aiCreateTasks.provideContext')}
                                rows={3}
                                disabled={isCreating}
                                className="mt-1"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">{t('tasks.priority')}</Label>
                                <Select
                                  value={task.priority}
                                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                                    handleTaskChange(task.id, 'priority', value)
                                  }
                                  disabled={isCreating}
                                >
                                  <SelectTrigger className="mt-1">
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
                                <Label className="text-xs">{t('tasks.estimatedDuration')}</Label>
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
                                  className="mt-1"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleCreateTasks}
                      disabled={tasks.length === 0 || isCreating || tasks.some(task => !task.title.trim() || !task.description?.trim())}
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('tasks.aiCreateTasks.creatingTasks')}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {t('tasks.aiCreateTasks.createTasks', { count: tasks.length })}
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
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

