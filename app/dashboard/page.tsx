import { createClient } from '@/lib/supabase/server'
import { getProjectCount, getPinnedProjects } from '@/lib/supabase/queries/projects'
import { getTodayStats, getWeeklyStats } from '@/lib/supabase/queries/analytics'
import { getRecentIncompleteTasks, getTodayCompletedTasks } from '@/lib/supabase/queries/tasks'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch all dashboard data in parallel to reduce total load time
  const [
    projectCount,
    todayStats,
    weeklyStats,
    recentTasks,
    todayCompletedTasks,
    pinnedProjects
  ] = await Promise.all([
    getProjectCount(user.id, 'active', supabase),
    getTodayStats(user.id),
    getWeeklyStats(user.id),
    getRecentIncompleteTasks(user.id, 5, supabase),
    getTodayCompletedTasks(user.id, supabase),
    getPinnedProjects(user.id, supabase)
  ])

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