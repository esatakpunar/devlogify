'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createTaskTemplate } from '@/lib/supabase/queries/taskTemplates'
import { toast } from 'sonner'

interface TaskTemplateDialogProps {
  userId: string
  onTemplateCreated?: () => void
  initialTask?: {
    title: string
    description: string | null
    priority: 'low' | 'medium' | 'high'
    estimated_duration: number | null
  }
}

export function TaskTemplateDialog({ userId, onTemplateCreated, initialTask }: TaskTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    priority: (initialTask?.priority || 'medium') as 'low' | 'medium' | 'high',
    estimated_duration: initialTask?.estimated_duration?.toString() || '',
  })

  // Update form data when initialTask changes
  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title || '',
        description: initialTask.description || '',
        priority: initialTask.priority || 'medium',
        estimated_duration: initialTask.estimated_duration?.toString() || '',
      })
    }
  }, [initialTask])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createTaskTemplate({
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        estimated_duration: formData.estimated_duration
          ? parseInt(formData.estimated_duration)
          : null,
        tags: [],
      })

      toast.success('Template created successfully')
      setOpen(false)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        estimated_duration: '',
      })
      onTemplateCreated?.()
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast.error(error.message || 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task Template</DialogTitle>
            <DialogDescription>
              Save this task as a template for quick reuse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="estimated_duration">Estimated Duration (min)</Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

