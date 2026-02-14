import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNotes } from '@/lib/supabase/queries/notes'
import { getProjects } from '@/lib/supabase/queries/projects'
import { NotesHeader } from '@/components/notes/NotesHeader'
import { NotesList } from '@/components/notes/NotesList'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  const companyId = profile.company_id

  const [notes, projects] = await Promise.all([
    getNotes(companyId, supabase),
    getProjects(companyId, 'active', supabase),
  ])

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