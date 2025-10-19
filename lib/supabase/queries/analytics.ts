import { createClient as createServerClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'

// Default timezone - Türkiye saati
const DEFAULT_TIMEZONE = 'Europe/Istanbul'

/**
 * Get user's timezone preference or default to Europe/Istanbul
 */
async function getUserTimezone(userId: string): Promise<string> {
  const supabase = await createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()
  
  return profile?.timezone || DEFAULT_TIMEZONE
}

/**
 * Get timezone-aware week boundaries
 */
async function getWeekBoundaries(userId: string) {
  const timezone = await getUserTimezone(userId)
  const now = new Date()
  
  // Convert current time to user's timezone
  const zonedNow = toZonedTime(now, timezone)
  
  // Calculate week boundaries in user's timezone
  const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })
  
  // Convert back to UTC for database queries
  const weekStartUTC = fromZonedTime(weekStart, timezone)
  const weekEndUTC = fromZonedTime(weekEnd, timezone)
  
  return { weekStartUTC, weekEndUTC, timezone }
}

export async function getWeeklyStats(userId: string) {
  const supabase = await createServerClient()
  const { weekStartUTC, weekEndUTC, timezone } = await getWeekBoundaries(userId)
  
  // Bu haftanın süreleri
  const { data: currentWeekEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', weekStartUTC.toISOString())
    .lte('started_at', weekEndUTC.toISOString())
    .not('duration', 'is', null)

  const currentWeekMinutes = currentWeekEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  // Geçen haftanın süreleri
  const lastWeekStartUTC = subWeeks(weekStartUTC, 1)
  const lastWeekEndUTC = subWeeks(weekEndUTC, 1)
  
  const { data: lastWeekEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', lastWeekStartUTC.toISOString())
    .lte('started_at', lastWeekEndUTC.toISOString())
    .not('duration', 'is', null)

  const lastWeekMinutes = lastWeekEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  // Bu haftanın tamamlanan taskları
  const { count: currentWeekTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', weekStartUTC.toISOString())
    .lte('completed_at', weekEndUTC.toISOString())

  // Geçen haftanın tamamlanan taskları
  const { count: lastWeekTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', lastWeekStartUTC.toISOString())
    .lte('completed_at', lastWeekEndUTC.toISOString())

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
  const { weekStartUTC, weekEndUTC, timezone } = await getWeekBoundaries(userId)

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('started_at, duration')
    .eq('user_id', userId)
    .gte('started_at', weekStartUTC.toISOString())
    .lte('started_at', weekEndUTC.toISOString())
    .not('duration', 'is', null)

  // Create array for 7 days starting from Monday
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStartUTC)
    date.setDate(date.getDate() + i)
    const zonedDate = toZonedTime(date, timezone)
    return {
      day: format(zonedDate, 'EEE', { timeZone: timezone }), // Mon, Tue, etc.
      minutes: 0,
    }
  })

  timeEntries?.forEach(entry => {
    // Convert UTC time to user's timezone to determine which day it belongs to
    const entryDateUTC = new Date(entry.started_at)
    const entryDateZoned = toZonedTime(entryDateUTC, timezone)
    
    // Calculate day index (0 = Monday, 6 = Sunday)
    const dayIndex = (entryDateZoned.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    dailyData[dayIndex].minutes += entry.duration || 0
  })

  return dailyData
}

export async function getProjectTimeDistribution(userId: string) {
  const supabase = await createServerClient()
  const { weekStartUTC, timezone } = await getWeekBoundaries(userId)

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select(`
      duration,
      task:tasks!inner(
        project:projects!inner(id, title, color)
      )
    `)
    .eq('user_id', userId)
    .gte('started_at', weekStartUTC.toISOString())
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
  const { weekStartUTC, timezone } = await getWeekBoundaries(userId)

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('started_at, duration')
    .eq('user_id', userId)
    .gte('started_at', weekStartUTC.toISOString())
    .not('duration', 'is', null)

  const dayTotals = new Map<string, number>()
  
  timeEntries?.forEach(entry => {
    // Convert UTC time to user's timezone to determine the day
    const entryDateUTC = new Date(entry.started_at)
    const entryDateZoned = toZonedTime(entryDateUTC, timezone)
    const day = format(entryDateZoned, 'EEEE', { timeZone: timezone }) // Monday, Tuesday, etc.
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
  const timezone = await getUserTimezone(userId)
  const now = new Date()
  
  // Convert current time to user's timezone
  const zonedNow = toZonedTime(now, timezone)
  
  // Calculate day boundaries in user's timezone
  const dayStart = startOfDay(zonedNow)
  const dayEnd = endOfDay(zonedNow)
  
  // Convert back to UTC for database queries
  const dayStartUTC = fromZonedTime(dayStart, timezone)
  const dayEndUTC = fromZonedTime(dayEnd, timezone)

  // Today's completed tasks count
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', dayStartUTC.toISOString())
    .lte('completed_at', dayEndUTC.toISOString())

  // Today's time entries
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('duration')
    .eq('user_id', userId)
    .gte('started_at', dayStartUTC.toISOString())
    .lte('started_at', dayEndUTC.toISOString())
    .not('duration', 'is', null)

  const totalMinutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0

  return {
    tasksCompleted: tasksCount || 0,
    totalMinutes,
  }
}