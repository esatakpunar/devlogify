import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { redirect } from 'next/navigation'
import { getTodayStats, getActivities } from '@/lib/supabase/queries/activities'
import { TimelinePageContent } from '@/components/timeline/TimelinePageContent'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const companyId = await getUserCompanyId(user.id, supabase)

  if (!companyId) {
    redirect('/onboarding')
  }

  // Bugün tamamlanan task sayısı ve harcanan süre
  const { completedTasks, totalMinutes } = await getTodayStats(companyId, supabase)

  // Aktiviteler
  const activities = await getActivities(companyId, 50, 0, supabase)

  return (
    <TimelinePageContent
      completedTasks={completedTasks}
      totalMinutes={totalMinutes}
      initialActivities={activities || []}
      userId={user.id}
    />
  )
}
