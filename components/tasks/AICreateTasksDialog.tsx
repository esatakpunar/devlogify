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
  onTasksCreated,
}: AICreateTasksDialogProps) {
  const [notesInput, setNotesInput] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [tasks, setTasks] = useState<EditableTask[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input')

  // Load initial note if provided
  useEffect(() => {
    if (initialNote && open) {
      setNotesInput(initialNote.content)
      if (initialNote.title) {
        setNotesInput(`${initialNote.title}\n\n${initialNote.content}`)
      }
    }
  }, [initialNote, open])

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
      setError('Please enter some notes or text')
      return
    }

    if (!selectedProjectId) {
      setError('Please select a project')
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
        throw new Error(errorData.error || 'Failed to generate tasks')
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
        toast.info('No tasks could be extracted from the notes')
      } else {
        toast.success(`Generated ${tasksWithIds.length} task(s)`)
      }
    } catch (err: any) {
      console.error('Error generating tasks:', err)
      setError(err.message || 'Failed to generate tasks. Please try again.')
      toast.error(err.message || 'Failed to generate tasks')
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
      setError('No tasks to create')
      return
    }

    if (!selectedProjectId) {
      setError('Please select a project')
      return
    }

    // Validate all tasks have titles and descriptions
    const invalidTasks = tasks.filter(t => !t.title.trim() || !t.description?.trim())
    if (invalidTasks.length > 0) {
      setError('All tasks must have both a title and description')
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

      toast.success(`Successfully created ${createdTasks.length} task(s)`)
      
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
      setError(err.message || 'Failed to create tasks')
      toast.error(err.message || 'Failed to create tasks')
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
            AI-Powered Task Creation
          </DialogTitle>
          <DialogDescription>
            Convert your meeting notes or text into structured tasks using AI
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
              Project <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isGenerating || isCreating}
            >
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Select a project" />
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
              <TabsTrigger value="input">Input Notes</TabsTrigger>
              <TabsTrigger value="preview" disabled={tasks.length === 0}>
                Preview Tasks {tasks.length > 0 && `(${tasks.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes-input">
                  Notes or Text <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="notes-input"
                  placeholder="Paste your meeting notes, to-do items, or any text here...&#10;&#10;Example:&#10;- Review the new design mockups&#10;- Update the API documentation&#10;- Schedule team meeting for next week"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={10}
                  disabled={isGenerating || isCreating}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  The AI will analyze your text and extract actionable tasks
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
                    Generating Tasks...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Tasks
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tasks generated yet. Go to the Input Notes tab to generate tasks.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Review and edit the generated tasks before creating them
                    </p>
                    <Button
                      onClick={handleAddTask}
                      variant="outline"
                      size="sm"
                      disabled={isCreating}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {tasks.map((task, index) => (
                      <Card key={task.id} className="p-4 border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-gray-500">
                              Task {index + 1}
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
                              <Label className="text-xs">Title *</Label>
                              <Input
                                value={task.title}
                                onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                                placeholder="Task title"
                                disabled={isCreating}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Description <span className="text-red-500">*</span></Label>
                              <Textarea
                                value={task.description || ''}
                                onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                                placeholder="Provide context, steps, or important details..."
                                rows={3}
                                disabled={isCreating}
                                className="mt-1"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Priority</Label>
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
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-xs">Estimated Duration (min)</Label>
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
                      disabled={tasks.length === 0 || isCreating || tasks.some(t => !t.title.trim() || !t.description?.trim())}
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Tasks...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Create {tasks.length} Task(s)
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
                      Cancel
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

