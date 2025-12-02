'use client'

import { useState } from 'react'
import { NoteCard } from './NoteCard'
import { CreateNoteDialog } from './CreateNoteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

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

interface NotesListProps {
  initialNotes: Note[]
  projects: Project[]
  userId: string
}

export function NotesList({ initialNotes, projects, userId }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const t = useTranslation()

  const filteredNotes = notes.filter(note => {
    const searchLower = searchQuery.toLowerCase()
    return (
      note.title?.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned)
  const regularNotes = filteredNotes.filter(n => !n.is_pinned)

  const handleNoteCreated = (newNote: Note) => {
    setNotes([newNote, ...notes])
  }

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
  }

  const handleNoteDeleted = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('notesList.searchNotes')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('notes.newNote')}</span>
          <span className="sm:hidden">{t('notes.newNote')}</span>
        </Button>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 bg-white rounded-lg border border-gray-200">
          <StickyNote className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 text-center">
            {searchQuery ? t('notesList.noNotesFound') : t('notes.noNotes')}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 text-center">
            {searchQuery ? t('notesList.tryDifferentSearch') : t('notesList.startCapturingIdeas')}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('notes.createNote')}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                {t('notesList.pinned')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    projects={projects}
                    userId={userId}
                    onNoteUpdated={handleNoteUpdated}
                    onNoteDeleted={handleNoteDeleted}
                    onTasksCreated={() => {
                      // Tasks created - could refresh notes or show notification
                      toast.success(t('notesList.tasksCreatedSuccessfully'))
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes */}
          {regularNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {t('notesList.allNotes')}
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    projects={projects}
                    userId={userId}
                    onNoteUpdated={handleNoteUpdated}
                    onNoteDeleted={handleNoteDeleted}
                    onTasksCreated={() => {
                      // Tasks created - could refresh notes or show notification
                      toast.success(t('notesList.tasksCreatedSuccessfully'))
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Note Dialog */}
      <CreateNoteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projects={projects}
        userId={userId}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  )
}