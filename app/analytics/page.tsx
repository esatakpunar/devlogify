import { createClient } from '@/lib/supabase/server'
import { WeeklySummary } from '@/components/analytics/WeeklySummary'
import { TimeChart } from '@/components/analytics/TimeChart'
import { ProjectDistribution } from '@/components/analytics/ProjectDistribution'
import { ProductivityInsights } from '@/components/analytics/ProductivityInsights'
import { AnalyticsPageContent } from '@/components/analytics/AnalyticsPageContent'
import { 
  getWeeklyStats, 
  getDailyTimeForWeek,
  getProjectTimeDistribution,
  getMostProductiveDay,
  getAverageTaskDuration
} from '@/lib/supabase/queries/analytics'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch all analytics data in parallel
  const [
    weeklyStats,
    dailyTime,
    projectDistribution,
    mostProductiveDay,
    avgTaskDuration
  ] = await Promise.all([
    getWeeklyStats(user.id),
    getDailyTimeForWeek(user.id),
    getProjectTimeDistribution(user.id),
    getMostProductiveDay(user.id),
    getAverageTaskDuration(user.id)
  ])

  return (
    <AnalyticsPageContent
      weeklyStats={weeklyStats}
      dailyTime={dailyTime}
      projectDistribution={projectDistribution}
      mostProductiveDay={mostProductiveDay}
      avgTaskDuration={avgTaskDuration}
      userId={user.id}
    />
  )
}