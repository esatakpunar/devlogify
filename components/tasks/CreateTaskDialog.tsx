'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  userId: string
  onTaskCreated: (task: any) => void
}

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  userId,
  onTaskCreated 
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Load templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open, userId])

  const loadTemplates = async () => {
    try {
      const data = await getTaskTemplates(userId)
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
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const newTask = await createTask({
        project_id: projectId,
        user_id: userId,
        title,
        description: description || null,
        priority,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
        status: 'todo',
        order_index: 0, // Will be updated by the database trigger or manually
        tags: tagsArray.length > 0 ? tagsArray : null,
      })
  
      // Activity log ekle
      await logActivity(
        userId,
        projectId,
        newTask.id,
        'task_created',
        { task_title: title }
      )
  
      onTaskCreated(newTask)
      
      // Reset form
      setTitle('')
      setDescription('')
      setPriority('medium')
      setEstimatedDuration('')
      setTags('')
      setSelectedTemplate(null)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quick Start from Template</Label>
                {!showTemplates && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Browse Templates
                  </Button>
                )}
              </div>
              
              {showTemplates && (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Select a template</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className="text-left p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{template.title}</div>
                            {template.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {template.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {template.priority}
                          </Badge>
                        </div>
                        {template.estimated_duration && (
                          <div className="text-xs text-gray-400 mt-1">
                            ~{template.estimated_duration} min
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm flex-1">
                    Using template: <strong>{selectedTemplate.title}</strong>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearTemplate}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-title">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="resize-none break-words overflow-wrap-anywhere w-full max-w-full h-40 overflow-y-auto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select 
                value={priority} 
                onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}
                disabled={loading}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-duration">Estimated Time (min)</Label>
              <Input
                id="task-duration"
                type="number"
                placeholder="60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="task-tags">Tags (optional)</Label>
            <Input
              id="task-tags"
              placeholder="api, frontend, bug (separate with commas)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Separate tags with commas</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}