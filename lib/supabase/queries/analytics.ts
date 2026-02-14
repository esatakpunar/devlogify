import { createClient as createServerClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'
import type { Database } from '@/types/supabase'

const DEFAULT_TIMEZONE = 'Europe/Istanbul'

async function getUserTimezone(userId: string): Promise<string> {
  const supabase = await createServerClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()
  const profile = profileData as Pick<Database['public']['Tables']['profiles']['Row'], 'timezone'> | null

  return profile?.timezone || DEFAULT_TIMEZONE
}

async function getWeekBoundaries(userId: string) {
  const timezone = await getUserTimezone(userId)
  const now = new Date()

  const zonedNow = toZonedTime(now, timezone)

  const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })

  const weekStartUTC = fromZonedTime(weekStart, timezone)
  const weekEndUTC = fromZonedTime(weekEnd, timezone)

  return { weekStartUTC, weekEndUTC, timezone }
}

export async function getWeeklyStats(companyId: string, userId: string) {
  const supabase = await createServerClient()
  const { weekStartUTC, weekEndUTC, timezone } = await getWeekBoundaries(userId)

  const lastWeekStartUTC = subWeeks(weekStartUTC, 1)
  const lastWeekEndUTC = subWeeks(weekEndUTC, 1)

  const [
    currentWeekEntriesResult,
    lastWeekEntriesResult,
    currentWeekTasksResult,
    lastWeekTasksResult
  ] = await Promise.all([
    supabase
      .from('time_entries')
      .select('duration')
      .eq('company_id', companyId)
      .gte('started_at', weekStartUTC.toISOString())
      .lte('started_at', weekEndUTC.toISOString())
      .not('duration', 'is', null),
    supabase
      .from('time_entries')
      .select('duration')
      .eq('company_id', companyId)
      .gte('started_at', lastWeekStartUTC.toISOString())
      .lte('started_at', lastWeekEndUTC.toISOString())
      .not('duration', 'is', null),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'done')
      .gte('completed_at', weekStartUTC.toISOString())
      .lte('completed_at', weekEndUTC.toISOString()),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'done')
      .gte('completed_at', lastWeekStartUTC.toISOString())
      .lte('completed_at', lastWeekEndUTC.toISOString())
  ])

  const currentWeekEntries = (currentWeekEntriesResult.data || []) as Pick<
    Database['public']['Tables']['time_entries']['Row'],
    'duration'
  >[]
  const lastWeekEntries = (lastWeekEntriesResult.data || []) as Pick<
    Database['public']['Tables']['time_entries']['Row'],
    'duration'
  >[]
  const currentWeekMinutes = currentWeekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  const lastWeekMinutes = lastWeekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  return {
    currentWeek: {
      minutes: currentWeekMinutes,
      tasks: currentWeekTasksResult.count || 0,
    },
    lastWeek: {
      minutes: lastWeekMinutes,
      tasks: lastWeekTasksResult.count || 0,
    },
  }
}

export async function getDailyTimeForWeek(companyId: string, userId: string) {
  const supabase = await createServerClient()
  const { weekStartUTC, weekEndUTC, timezone } = await getWeekBoundaries(userId)

  const { data: timeEntriesData } = await supabase
    .from('time_entries')
    .select('started_at, duration')
    .eq('company_id', companyId)
    .gte('started_at', weekStartUTC.toISOString())
    .lte('started_at', weekEndUTC.toISOString())
    .not('duration', 'is', null)
  const timeEntries = (timeEntriesData || []) as Pick<
    Database['public']['Tables']['time_entries']['Row'],
    'started_at' | 'duration'
  >[]

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStartUTC)
    date.setDate(date.getDate() + i)
    const zonedDate = toZonedTime(date, timezone)
    return {
      day: format(zonedDate, 'EEE', { timeZone: timezone }),
      minutes: 0,
    }
  })

  timeEntries?.forEach(entry => {
    const entryDateUTC = new Date(entry.started_at)
    const entryDateZoned = toZonedTime(entryDateUTC, timezone)

    const dayIndex = (entryDateZoned.getDay() + 6) % 7
    dailyData[dayIndex].minutes += entry.duration || 0
  })

  return dailyData
}

export async function getProjectTimeDistribution(companyId: string, userId: string) {
  const supabase = await createServerClient()
  const { weekStartUTC, timezone } = await getWeekBoundaries(userId)

  const { data: timeEntriesData } = await supabase
    .from('time_entries')
    .select(`
      duration,
      task:tasks!inner(
        project:projects!inner(id, title, color)
      )
    `)
    .eq('company_id', companyId)
    .gte('started_at', weekStartUTC.toISOString())
    .not('duration', 'is', null)
  const timeEntries = timeEntriesData || []

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

export async function getMostProductiveDay(companyId: string, userId: string) {
  const supabase = await createServerClient()
  const { weekStartUTC, timezone } = await getWeekBoundaries(userId)

  const { data: timeEntriesData } = await supabase
    .from('time_entries')
    .select('started_at, duration')
    .eq('company_id', companyId)
    .gte('started_at', weekStartUTC.toISOString())
    .not('duration', 'is', null)
  const timeEntries = (timeEntriesData || []) as Pick<
    Database['public']['Tables']['time_entries']['Row'],
    'started_at' | 'duration'
  >[]

  const dayTotals = new Map<string, number>()

  timeEntries?.forEach(entry => {
    const entryDateUTC = new Date(entry.started_at)
    const entryDateZoned = toZonedTime(entryDateUTC, timezone)
    const day = format(entryDateZoned, 'EEEE', { timeZone: timezone })
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

export async function getAverageTaskDuration(companyId: string) {
  const supabase = await createServerClient()

  const { data: tasksData } = await supabase
    .from('tasks')
    .select('actual_duration')
    .eq('company_id', companyId)
    .eq('status', 'done')
    .gt('actual_duration', 0)
  const tasks = (tasksData || []) as Pick<Database['public']['Tables']['tasks']['Row'], 'actual_duration'>[]

  if (!tasks || tasks.length === 0) return 0

  const total = tasks.reduce((sum, task) => sum + task.actual_duration, 0)
  return Math.round(total / tasks.length)
}

export async function getTodayStats(companyId: string, userId: string) {
  const supabase = await createServerClient()
  const timezone = await getUserTimezone(userId)
  const now = new Date()

  const zonedNow = toZonedTime(now, timezone)

  const dayStart = startOfDay(zonedNow)
  const dayEnd = endOfDay(zonedNow)

  const dayStartUTC = fromZonedTime(dayStart, timezone)
  const dayEndUTC = fromZonedTime(dayEnd, timezone)

  const [tasksResult, timeEntriesResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'done')
      .gte('completed_at', dayStartUTC.toISOString())
      .lte('completed_at', dayEndUTC.toISOString()),
    supabase
      .from('time_entries')
      .select('duration')
      .eq('company_id', companyId)
      .gte('started_at', dayStartUTC.toISOString())
      .lte('started_at', dayEndUTC.toISOString())
      .not('duration', 'is', null)
  ])

  const todayEntries = (timeEntriesResult.data || []) as Pick<
    Database['public']['Tables']['time_entries']['Row'],
    'duration'
  >[]
  const totalMinutes = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  return {
    tasksCompleted: tasksResult.count || 0,
    totalMinutes,
  }
}
