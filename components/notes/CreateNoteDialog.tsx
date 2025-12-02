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
import { MarkdownEditor } from './MarkdownEditor'
import { NoteTemplates } from './NoteTemplates'

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
  const [useMarkdown, setUseMarkdown] = useState(false)
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
      <DialogContent className="max-w-none sm:max-w-[900px] max-h-none sm:max-h-[95vh] h-full sm:h-auto overflow-hidden p-0 flex flex-col rounded-none sm:rounded-lg w-full sm:w-auto fixed top-0 left-0 right-0 bottom-0 sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%]">
        {/* Fixed Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">{t('notes.createNewNote')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t('notes.captureYourIdeas')}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label htmlFor="note-content" className="text-sm sm:text-base">
                  {t('notes.content')} <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <NoteTemplates onSelectTemplate={(template) => setContent(template)} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUseMarkdown(!useMarkdown)}
                    className="text-xs sm:text-sm"
                  >
                    {useMarkdown ? 'Plain Text' : 'Markdown'}
                  </Button>
                </div>
              </div>
              {useMarkdown ? (
                <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
                  <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder={t('notes.writeYourNoteHere')}
                    className="h-full"
                  />
                </div>
              ) : (
                <Textarea
                  id="note-content"
                  placeholder={t('notes.writeYourNoteHere')}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={loading}
                  required
                  className="resize-none break-words overflow-wrap-anywhere w-full max-w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-y-auto text-sm sm:text-base"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          </div>

          {/* Fixed Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-background sticky bottom-0 z-10">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto h-10 sm:h-9"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:flex-1 h-10 sm:h-9">
                {loading ? t('notes.creatingNote') : t('notes.createNote')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}