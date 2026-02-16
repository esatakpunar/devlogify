import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { getProjectOptions } from '@/lib/supabase/queries/projects'
import { getCompanyTasks } from '@/lib/supabase/queries/tasks'
import { getTeamsWithMembers } from '@/lib/supabase/queries/teams'
import { getSprints } from '@/lib/supabase/queries/sprints'
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

  const [projects, tasks, teams, sprints] = await Promise.all([
    getProjectOptions(companyId, 'active', supabase),
    getCompanyTasks(companyId, { limit: 300, offset: 0 }, supabase),
    getTeamsWithMembers(companyId, supabase),
    getSprints(companyId, {}, supabase),
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
      teams={(teams || []).map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        memberUserIds: (team.team_members || []).map((member) => member.user_id),
      }))}
      sprints={sprints || []}
    />
  )
}
