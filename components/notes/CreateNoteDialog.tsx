'use client'

import { useState } from 'react'
import { createNote } from '@/lib/supabase/queries/notes'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Project {
  id: string
  title: string
  color: string
}

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  userId: string
  onNoteCreated: (note: any) => void
}

export function CreateNoteDialog({ 
  open, 
  onOpenChange, 
  projects,
  userId,
  onNoteCreated 
}: CreateNoteDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error(t('notes.pleaseEnterNoteContent'))
      return
    }

    setLoading(true)

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

        const newNote = await createNote({
          user_id: userId,
          title: title.trim() || null,
          content: content.trim(),
          project_id: projectId || null,  
          tags: tagsArray.length > 0 ? tagsArray : null,
        })

      // Activity log
      await logActivity(
        userId,
        projectId || null,
        null,
        'note_created',
        { note_title: title || t('notes.untitled') }
      )

      onNoteCreated(newNote)
      toast.success(t('notes.noteCreated'))

      // Reset form
      setTitle('')
      setContent('')
      setProjectId('')
      setTags('')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to create note:', error)
      toast.error(t('notes.failedToCreateNote'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('notes.createNewNote')}</DialogTitle>
          <DialogDescription>
            {t('notes.captureYourIdeas')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          <div className="space-y-2">
            <Label htmlFor="note-title">{t('notes.titleOptional')}</Label>
            <Input
              id="note-title"
              placeholder={t('notes.noteTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="note-content">
              {t('notes.content')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="note-content"
              placeholder={t('notes.writeYourNoteHere')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              required
              className="resize-none break-words overflow-wrap-anywhere w-full max-w-full h-64 overflow-y-auto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="note-project">{t('notes.projectOptional')}</Label>
            <Select 
              value={projectId || undefined}  
              onValueChange={setProjectId}
              disabled={loading}
            >
              <SelectTrigger id="note-project">
                <SelectValue placeholder={t('common.none')} />
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
            <p className="text-xs text-gray-500">{t('notes.leaveEmptyForNoProject')}</p>  
          </div>

            <div className="space-y-2">
              <Label htmlFor="note-tags">{t('notes.tagsOptional')}</Label>
              <Input
                id="note-tags"
                placeholder={t('notes.tagsPlaceholder')}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">{t('notes.separateWithCommas')}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('notes.creatingNote') : t('notes.createNote')}
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