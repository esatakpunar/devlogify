import { createClient } from '@/lib/supabase/server'
import { getTodayStats, getActivities } from '@/lib/supabase/queries/activities'
import { TimelinePageContent } from '@/components/timeline/TimelinePageContent'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Bugün tamamlanan task sayısı ve harcanan süre
  const { completedTasks, totalMinutes } = await getTodayStats(user.id, supabase)

  // Aktiviteler
  const activities = await getActivities(user.id, 50, 0, supabase)

  return (
    <TimelinePageContent
      completedTasks={completedTasks}
      totalMinutes={totalMinutes}
      initialActivities={activities || []}
      userId={user.id}
    />
  )
}