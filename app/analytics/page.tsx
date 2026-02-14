import { createClient } from '@/lib/supabase/server'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  const companyId = profile.company_id

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