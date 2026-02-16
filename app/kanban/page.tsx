import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { getProjectOptions } from '@/lib/supabase/queries/projects'
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

  const companyId = await getUserCompanyId(user.id, supabase)

  if (!companyId) {
    redirect('/onboarding')
  }

  const [projects, tasks] = await Promise.all([
    getProjectOptions(companyId, 'active', supabase),
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
