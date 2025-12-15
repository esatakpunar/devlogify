'use client'

import { useState } from 'react'
import { MoreVertical, Pin, Edit, Trash, Tag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { togglePinNote, deleteNote } from '@/lib/supabase/queries/notes'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { EditNoteDialog } from './EditNoteDialog'
import { AICreateTasksDialog } from '@/components/tasks/AICreateTasksDialog'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import Link from 'next/link'
import { usePremium } from '@/lib/hooks/usePremium'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'
import { getPlainTextFromHTML } from '@/components/ui/HTMLContent'

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

interface NoteCardProps {
  note: Note
  projects: Project[]
  userId: string
  onNoteUpdated: (note: Note) => void
  onNoteDeleted: (noteId: string) => void
  onTasksCreated?: (tasks: any[]) => void
}

export function NoteCard({ note, projects, userId, onNoteUpdated, onNoteDeleted, onTasksCreated }: NoteCardProps) {
  const { isPremium } = usePremium(userId)
  const [loading, setLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const t = useTranslation()
  const { confirm, confirmWithAction, Modal: ConfirmModal } = useConfirmModal()

  const handleTogglePin = async () => {
    setLoading(true)
    try {
      const updatedNote = await togglePinNote(note.id, !note.is_pinned)
      onNoteUpdated(updatedNote as any)
      toast.success(note.is_pinned ? t('noteCard.noteUnpinned') : t('noteCard.notePinned'))
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast.error(t('notes.failedToUpdateNote'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('noteCard.areYouSureDeleteNote'),
      description: t('noteCard.deleteNoteDescription') || undefined,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    })

    if (!confirmed) return

    setLoading(true)
    try {
      await deleteNote(note.id)
      onNoteDeleted(note.id)
      toast.success(t('noteCard.noteDeleted'))
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast.error(t('noteCard.failedToDeleteNote'))
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on dropdown or links
    const target = e.target as HTMLElement
    if (
      target.closest('[role="menuitem"]') ||
      target.closest('button') ||
      target.closest('a')
    ) {
      return
    }
    setIsEditDialogOpen(true)
  }

  return (
    <>
      <div 
        className="group bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
          <div className="flex-1 min-w-0">
            {note.title && (
              <h3 className="font-semibold text-sm sm:text-base line-clamp-1 mb-1">
                {note.title}
              </h3>
            )}
            {note.project && (
              <Link 
                href={`/projects/${note.project.id}`}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: note.project.color }}
                />
                <span className="truncate max-w-[120px] sm:max-w-none">{note.project.title}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {note.is_pinned && (
              <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem 
                  onClick={() => {
                    if (isPremium) {
                      setIsAIDialogOpen(true)
                    } else {
                      setUpgradeDialogOpen(true)
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('noteCard.createTasksFromNote')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePin}>
                  <Pin className="w-4 h-4 mr-2" />
                  {note.is_pinned ? t('noteCard.unpin') : t('noteCard.pin')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash className="w-4 h-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 sm:line-clamp-4 mb-2 sm:mb-3 whitespace-pre-wrap break-words">
          {getPlainTextFromHTML(note.content)}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {note.tags && note.tags.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
              {note.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs truncate max-w-[80px] sm:max-w-none">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 2 && (
                <span className="text-xs text-gray-500 flex-shrink-0">+{note.tags.length - 2}</span>
              )}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditNoteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        note={note}
        projects={projects}
        userId={userId}
        onNoteUpdated={onNoteUpdated}
      />

      {/* AI Create Tasks Dialog */}
      {isPremium && (
        <AICreateTasksDialog
          open={isAIDialogOpen}
          onOpenChange={setIsAIDialogOpen}
          projects={projects}
          userId={userId}
          initialNote={note}
          onTasksCreated={onTasksCreated}
        />
      )}

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="AI Task Generation from Notes"
      />
      {ConfirmModal}
    </>
  )
}