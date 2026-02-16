import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { redirect } from 'next/navigation'
import { getProjectCount, getPinnedProjects } from '@/lib/supabase/queries/projects'
import { getTodayStats, getWeeklyStats } from '@/lib/supabase/queries/analytics'
import { getRecentIncompleteTasks, getTodayCompletedTasks } from '@/lib/supabase/queries/tasks'
import { getActiveSprint, getSprintMetrics } from '@/lib/supabase/queries/sprints'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const companyId = await getUserCompanyId(user.id, supabase)

  if (!companyId) {
    redirect('/onboarding')
  }

  // Fetch all dashboard data in parallel to reduce total load time
  const [
    projectCount,
    todayStats,
    weeklyStats,
    recentTasks,
    todayCompletedTasks,
    pinnedProjects,
    activeSprint,
  ] = await Promise.all([
    getProjectCount(companyId, 'active', supabase),
    getTodayStats(companyId, user.id),
    getWeeklyStats(companyId, user.id),
    getRecentIncompleteTasks(companyId, 5, supabase),
    getTodayCompletedTasks(companyId, supabase),
    getPinnedProjects(companyId, supabase),
    getActiveSprint(companyId, supabase),
  ])

  const activeSprintMetrics = activeSprint
    ? await getSprintMetrics(companyId, activeSprint.id, activeSprint.end_date, supabase)
    : null

  return (
    <DashboardContent
      user={user}
      companyId={companyId}
      projectCount={projectCount}
      todayStats={todayStats}
      weeklyStats={weeklyStats}
      recentTasks={recentTasks || []}
      todayCompletedTasks={todayCompletedTasks || []}
      pinnedProjects={pinnedProjects || []}
      activeSprint={activeSprint}
      activeSprintMetrics={activeSprintMetrics}
    />
  )
}
