import { createClient as createServerClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay } from 'date-fns'

export async function getWeeklyStats(userId: string) {
  const supabase = await createServerClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  
  // Bu haftanın süreleri
  const { data: currentWeekEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', weekStart.toISOString())
    .lte('started_at', weekEnd.toISOString())
    .not('duration', 'is', null)

  const currentWeekMinutes = currentWeekEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  // Geçen haftanın süreleri
  const lastWeekStart = subWeeks(weekStart, 1)
  const lastWeekEnd = subWeeks(weekEnd, 1)
  
  const { data: lastWeekEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', lastWeekStart.toISOString())
    .lte('started_at', lastWeekEnd.toISOString())
    .not('duration', 'is', null)

  const lastWeekMinutes = lastWeekEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  // Bu haftanın tamamlanan taskları
  const { count: currentWeekTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString())

  // Geçen haftanın tamamlanan taskları
  const { count: lastWeekTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', lastWeekStart.toISOString())
    .lte('completed_at', lastWeekEnd.toISOString())

  return {
    currentWeek: {
      minutes: currentWeekMinutes,
      tasks: currentWeekTasks || 0,
    },
    lastWeek: {
      minutes: lastWeekMinutes,
      tasks: lastWeekTasks || 0,
    },
  }
}

export async function getDailyTimeForWeek(userId: string) {
  const supabase = await createServerClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('started_at, duration')
    .eq('user_id', userId)
    .gte('started_at', weekStart.toISOString())
    .lte('started_at', weekEnd.toISOString())
    .not('duration', 'is', null)

  // Group by day
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: 0,
    }
  })

  timeEntries?.forEach(entry => {
    const entryDate = new Date(entry.started_at)
    const dayIndex = (entryDate.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    dailyData[dayIndex].minutes += entry.duration || 0
  })

  return dailyData
}

export async function getProjectTimeDistribution(userId: string) {
  const supabase = await createServerClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select(`
      duration,
      task:tasks!inner(
        project:projects!inner(id, title, color)
      )
    `)
    .eq('user_id', userId)
    .gte('started_at', weekStart.toISOString())
    .not('duration', 'is', null)

  // Group by project
  const projectMap = new Map<string, { title: string; color: string; minutes: number }>()

  timeEntries?.forEach((entry: any) => {
    const project = entry.task?.project
    if (project) {
      const existing = projectMap.get(project.id) || { title: project.title, color: project.color, minutes: 0 }
      existing.minutes += entry.duration || 0
      projectMap.set(project.id, existing)
    }
  })

  return Array.from(projectMap.values())
}

export async function getMostProductiveDay(userId: string) {
  const supabase = await createServerClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('started_at, duration')
    .eq('user_id', userId)
    .gte('started_at', weekStart.toISOString())
    .not('duration', 'is', null)

  const dayTotals = new Map<string, number>()
  
  timeEntries?.forEach(entry => {
    const day = new Date(entry.started_at).toLocaleDateString('en-US', { weekday: 'long' })
    dayTotals.set(day, (dayTotals.get(day) || 0) + (entry.duration || 0))
  })

  let maxDay = ''
  let maxMinutes = 0

  dayTotals.forEach((minutes, day) => {
    if (minutes > maxMinutes) {
      maxMinutes = minutes
      maxDay = day
    }
  })

  return { day: maxDay || 'N/A', minutes: maxMinutes }
}

export async function getAverageTaskDuration(userId: string) {
  const supabase = await createServerClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('actual_duration')
    .eq('user_id', userId)
    .eq('status', 'done')
    .gt('actual_duration', 0)

  if (!tasks || tasks.length === 0) return 0

  const total = tasks.reduce((sum, task) => sum + task.actual_duration, 0)
  return Math.round(total / tasks.length)
}

export async function getTodayStats(userId: string) {
  const supabase = await createServerClient()
  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  // Today's completed tasks count
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', dayStart.toISOString())
    .lte('completed_at', dayEnd.toISOString())

  // Today's time entries
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', dayStart.toISOString())
    .lte('started_at', dayEnd.toISOString())
    .not('duration', 'is', null)

  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  return {
    tasksCompleted: tasksCount || 0,
    totalMinutes,
  }
}