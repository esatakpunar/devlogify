'use client'

import { useState } from 'react'
import { updateNote } from '@/lib/supabase/queries/notes'
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
import { toast } from 'sonner'

interface Note {
  id: string
  title: string | null
  content: string
  tags: string[] | null
  is_pinned: boolean
  created_at: string
  project?: {
    id: string
    title: string
    color: string
  } | null
}

interface Project {
  id: string
  title: string
  color: string
}

interface EditNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note
  projects: Project[]
  userId: string
  onNoteUpdated: (note: any) => void
}

export function EditNoteDialog({ 
  open, 
  onOpenChange, 
  note,
  projects,
  userId,
  onNoteUpdated 
}: EditNoteDialogProps) {
  const [title, setTitle] = useState(note.title || '')
  const [content, setContent] = useState(note.content)
  const [projectId, setProjectId] = useState<string>(note.project?.id || '')
  const [tags, setTags] = useState(note.tags?.join(', ') || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('Please enter note content')
      return
    }

    setLoading(true)

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const updatedNote = await updateNote(note.id, {
        title: title.trim() || null,
        content: content.trim(),
        project_id: projectId || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      })

      onNoteUpdated(updatedNote)
      toast.success('Note updated')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to update note:', error)
      toast.error('Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Update your note
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-note-title">Title (optional)</Label>
            <Input
              id="edit-note-title"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-note-content">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-note-content"
              placeholder="Write your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-note-project">Project (optional)</Label>
            <Select 
              value={projectId || undefined}  
              onValueChange={setProjectId}
              disabled={loading}
            >
              <SelectTrigger id="edit-note-project">
                <SelectValue placeholder="None" />
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
            <p className="text-xs text-gray-500">Leave empty for no project</p>  
          </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note-tags">Tags (optional)</Label>
              <Input
                id="edit-note-tags"
                placeholder="work, ideas, todo"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Separate with commas</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
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