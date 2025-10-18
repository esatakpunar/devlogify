import { createClient } from '@/lib/supabase/server'
import { getNotes } from '@/lib/supabase/queries/notes'
import { getProjects } from '@/lib/supabase/queries/projects'
import { NotesHeader } from '@/components/notes/NotesHeader'
import { NotesList } from '@/components/notes/NotesList'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const notes = await getNotes(user.id, supabase)
  const projects = await getProjects(user.id, 'active', supabase)

  return (
    <div className="space-y-6">
      <NotesHeader />
      <NotesList
        initialNotes={notes || []}
        projects={projects || []}
        userId={user.id}
      />
    </div>
  )
}