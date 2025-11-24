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

  const weeklyStats = await getWeeklyStats(user.id)
  const dailyTime = await getDailyTimeForWeek(user.id)
  const projectDistribution = await getProjectTimeDistribution(user.id)
  const mostProductiveDay = await getMostProductiveDay(user.id)
  const avgTaskDuration = await getAverageTaskDuration(user.id)

  return (
    <AnalyticsPageContent
      weeklyStats={weeklyStats}
      dailyTime={dailyTime}
      projectDistribution={projectDistribution}
      mostProductiveDay={mostProductiveDay}
      avgTaskDuration={avgTaskDuration}
    />
  )
}