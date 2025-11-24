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
import Link from 'next/link'

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
  const [loading, setLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)

  const handleTogglePin = async () => {
    setLoading(true)
    try {
      const updatedNote = await togglePinNote(note.id, !note.is_pinned)
      onNoteUpdated(updatedNote as any)
      toast.success(note.is_pinned ? 'Note unpinned' : 'Note pinned')
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast.error('Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setLoading(true)
    try {
      await deleteNote(note.id)
      onNoteDeleted(note.id)
      toast.success('Note deleted')
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast.error('Failed to delete note')
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
        className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {note.title && (
              <h3 className="font-semibold text-base line-clamp-1 mb-1">
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
                <span>{note.project.title}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1">
            {note.is_pinned && (
              <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setIsAIDialogOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Tasks from Note
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePin}>
                  <Pin className="w-4 h-4 mr-2" />
                  {note.is_pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-gray-700 line-clamp-4 mb-3 whitespace-pre-wrap">
          {note.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {note.tags && note.tags.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {note.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
              )}
            </div>
          ) : (
            <div />
          )}
          <span className="text-xs text-gray-400">
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
      <AICreateTasksDialog
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        projects={projects}
        userId={userId}
        initialNote={note}
        onTasksCreated={onTasksCreated}
      />
    </>
  )
}