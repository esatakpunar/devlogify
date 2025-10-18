import { createClient } from '@/lib/supabase/server'
import { getTodayStats, getActivities } from '@/lib/supabase/queries/activities'
import { TimelineStats } from '@/components/timeline/TimelineStats'
import { TimelineContent } from '@/components/timeline/TimelineContent'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Bugün tamamlanan task sayısı ve harcanan süre
  const { completedTasks, totalMinutes } = await getTodayStats(user.id, supabase)

  // Aktiviteler
  const activities = await getActivities(user.id, 50, 0, supabase)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Timeline</h1>
        <p className="text-gray-600 mt-1">
          Your activity history and work log
        </p>
      </div>

      {/* Stats */}
      <TimelineStats
        completedTasks={completedTasks}
        totalMinutes={totalMinutes}
      />

      {/* Timeline Content */}
      <TimelineContent
        initialActivities={activities || []}
        userId={user.id}
      />
    </div>
  )
}