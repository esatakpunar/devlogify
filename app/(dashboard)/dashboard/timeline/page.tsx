import { createClient } from '@/lib/supabase/server'
import { TimelineStats } from '@/components/timeline/TimelineStats'
import { TimelineContent } from '@/components/timeline/TimelineContent'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Bugün tamamlanan task sayısı
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'done')
    .gte('completed_at', today.toISOString())

  // Bugün harcanan süre
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', user?.id)
    .gte('started_at', today.toISOString())
    .not('duration', 'is', null)

  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  // Aktiviteler
  const { data: activities } = await supabase
    .from('activity_logs')
    .select(`
      *,
      project:projects(id, title, color),
      task:tasks(id, title)
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

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
        completedTasks={completedTasks || 0}
        totalMinutes={totalMinutes}
      />

      {/* Timeline Content */}
      <TimelineContent 
        initialActivities={activities || []}
        userId={user?.id || ''}
      />
    </div>
  )
}