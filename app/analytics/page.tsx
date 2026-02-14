import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { redirect } from 'next/navigation'
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

  const companyId = await getUserCompanyId(user.id, supabase)

  if (!companyId) {
    redirect('/onboarding')
  }

  // Fetch all analytics data in parallel
  const [
    weeklyStats,
    dailyTime,
    projectDistribution,
    mostProductiveDay,
    avgTaskDuration
  ] = await Promise.all([
    getWeeklyStats(companyId, user.id),
    getDailyTimeForWeek(companyId, user.id),
    getProjectTimeDistribution(companyId, user.id),
    getMostProductiveDay(companyId, user.id),
    getAverageTaskDuration(companyId)
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
