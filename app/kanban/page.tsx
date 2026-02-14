import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/supabase/queries/projects'
import { getCompanyTasks } from '@/lib/supabase/queries/tasks'
import { KanbanWorkspace } from '@/components/tasks/KanbanWorkspace'

export default async function KanbanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  const companyId = profile.company_id

  const [projects, tasks] = await Promise.all([
    getProjects(companyId, undefined, supabase),
    getCompanyTasks(companyId, supabase),
  ])

  return (
    <KanbanWorkspace
      userId={user.id}
      companyId={companyId}
      initialTasks={tasks || []}
      projects={(projects || []).map((project) => ({
        id: project.id,
        title: project.title,
        color: project.color,
      }))}
    />
  )
}
