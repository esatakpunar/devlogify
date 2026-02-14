import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTodayStats, getActivities } from '@/lib/supabase/queries/activities'
import { TimelinePageContent } from '@/components/timeline/TimelinePageContent'

export default async function TimelinePage() {
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