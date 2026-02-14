import { createClient as createBrowserClient } from '@/lib/supabase/client'

export type TimeEntry = {
  id: string
  task_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  duration: number | null
  note: string | null
  is_manual: boolean
  created_at: string
}

export type TimeEntryInsert = {
  task_id: string
  user_id: string
  started_at: string
  ended_at?: string | null
  duration?: number | null
  note?: string | null
  is_manual?: boolean
}

export type TimeEntryUpdate = {
  ended_at?: string
  duration?: number
  note?: string | null
}

/**
 * Start a new time entry for a task
 */
export async function startTimeEntry(taskId: string, userId: string) {
  const supabase = createBrowserClient() as any
  const startTime = new Date()

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      task_id: taskId,
      user_id: userId,
      started_at: startTime.toISOString(),
      is_manual: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Stop an active time entry and update task's actual duration
 */
export async function stopTimeEntry(
  taskId: string,
  userId: string,
  durationMinutes: number,
  note?: string
) {
  const supabase = createBrowserClient() as any
  const endTime = new Date()

  // Update the time entry
  const { error: timeEntryError } = await supabase
    .from('time_entries')
    .update({
      ended_at: endTime.toISOString(),
      duration: durationMinutes,
      note: note || null,
    })
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .is('ended_at', null)

  if (timeEntryError) throw timeEntryError

  // Get task info and update actual duration
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('actual_duration, project_id')
    .eq('id', taskId)
    .single()

  if (taskError) throw taskError

  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      actual_duration: task.actual_duration + durationMinutes
    })
    .eq('id', taskId)

  if (updateError) throw updateError

  return { projectId: task.project_id, duration: durationMinutes }
}

/**
 * Add manual time entry for a task
 */
export async function addManualTimeEntry(
  taskId: string,
  userId: string,
  minutes: number,
  note?: string
) {
  const supabase = createBrowserClient() as any
  const now = new Date()
  const startTime = new Date(now.getTime() - minutes * 60000)

  // Create time entry
  const { error: timeEntryError } = await supabase
    .from('time_entries')
    .insert({
      task_id: taskId,
      user_id: userId,
      started_at: startTime.toISOString(),
      ended_at: now.toISOString(),
      duration: minutes,
      note: note || null,
      is_manual: true,
    })

  if (timeEntryError) throw timeEntryError

  // Get task info and update actual duration
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('actual_duration, project_id')
    .eq('id', taskId)
    .single()

  if (taskError) throw taskError

  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      actual_duration: task.actual_duration + minutes
    })
    .eq('id', taskId)

  if (updateError) throw updateError

  return { projectId: task.project_id, duration: minutes }
}

/**
 * Get time entries for a specific task
 */
export async function getTimeEntriesByTask(taskId: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data as TimeEntry[]
}

/**
 * Get time entries for a user within a date range
 */
export async function getTimeEntriesByDateRange(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const supabase = createBrowserClient() as any

  let query = supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)

  if (startDate) {
    query = query.gte('started_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('started_at', endDate.toISOString())
  }

  const { data, error } = await query.order('started_at', { ascending: false })

  if (error) throw error
  return data as TimeEntry[]
}

/**
 * Get active time entry for a user
 */
export async function getActiveTimeEntry(userId: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No active timer found
      return null
    }
    throw error
  }

  return data as TimeEntry
}
