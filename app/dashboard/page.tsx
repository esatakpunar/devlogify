import { createClient } from '@/lib/supabase/server'
import { getProjectCount, getPinnedProjects } from '@/lib/supabase/queries/projects'
import { getTodayStats, getWeeklyStats } from '@/lib/supabase/queries/analytics'
import { getRecentIncompleteTasks, getTodayCompletedTasks } from '@/lib/supabase/queries/tasks'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch actual stats
  const projectCount = await getProjectCount(user.id, 'active', supabase)
  const todayStats = await getTodayStats(user.id)
  const weeklyStats = await getWeeklyStats(user.id)

  // Fetch dashboard data
  const recentTasks = await getRecentIncompleteTasks(user.id, 5, supabase)
  const todayCompletedTasks = await getTodayCompletedTasks(user.id, supabase)
  const pinnedProjects = await getPinnedProjects(user.id, supabase)

  return (
    <DashboardContent
      user={user}
      projectCount={projectCount}
      todayStats={todayStats}
      weeklyStats={weeklyStats}
      recentTasks={recentTasks || []}
      todayCompletedTasks={todayCompletedTasks || []}
      pinnedProjects={pinnedProjects || []}
    />
  )
}