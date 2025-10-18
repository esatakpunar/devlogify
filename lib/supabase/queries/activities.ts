import { createClient } from '@/lib/supabase/client'

export async function getActivities(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      project:projects(id, title, color),
      task:tasks(id, title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getActivitiesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      project:projects(id, title, color),
      task:tasks(id, title)
    `)
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTodayStats(userId: string) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Bugün tamamlanan task sayısı
  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', today.toISOString())

  // Bugün harcanan süre
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', today.toISOString())
    .not('duration', 'is', null)

  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  return {
    completedTasks: completedTasks || 0,
    totalMinutes,
  }
}