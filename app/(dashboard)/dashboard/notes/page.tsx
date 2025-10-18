import { createClient } from '@/lib/supabase/server'
import { NotesHeader } from '@/components/notes/NotesHeader'
import { NotesList } from '@/components/notes/NotesList'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from('notes')
    .select(`
      *,
      project:projects(id, title, color)
    `)
    .eq('user_id', user?.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, color')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .order('title')

  return (
    <div className="space-y-6">
      <NotesHeader />
      <NotesList 
        initialNotes={notes || []} 
        projects={projects || []}
        userId={user?.id || ''}
      />
    </div>
  )
}