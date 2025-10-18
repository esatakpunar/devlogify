import { createClient } from '@/lib/supabase/server'
import { WeeklySummary } from '@/components/analytics/WeeklySummary'
import { TimeChart } from '@/components/analytics/TimeChart'
import { ProjectDistribution } from '@/components/analytics/ProjectDistribution'
import { ProductivityInsights } from '@/components/analytics/ProductivityInsights'
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Your productivity insights and trends
        </p>
      </div>

      {/* Weekly Summary */}
      <WeeklySummary stats={weeklyStats} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <TimeChart data={dailyTime} />
        <ProjectDistribution data={projectDistribution} />
      </div>

      {/* Insights */}
      <ProductivityInsights 
        mostProductiveDay={mostProductiveDay}
        avgTaskDuration={avgTaskDuration}
        weeklyStats={weeklyStats}
      />
    </div>
  )
}