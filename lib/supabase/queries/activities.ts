import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getActivities(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  supabaseClient?: SupabaseClient<Database>
) {
  const supabase = supabaseClient || createBrowserClient()

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
  const supabase = createBrowserClient()

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

export async function getTodayStats(userId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
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

  const totalMinutes = timeEntries?.reduce((sum: number, entry: any) => sum + (entry.duration || 0), 0) || 0

  return {
    completedTasks: completedTasks || 0,
    totalMinutes,
  }
}

/**
 * Activity logging functions
 */

export type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'task_status_changed'
  | 'task_progress_updated'
  | 'task_progress_milestone'
  | 'time_logged'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'note_created'

export async function logActivity(
  userId: string,
  projectId: string | null,
  taskId: string | null,
  actionType: ActivityType,
  metadata?: any
) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      project_id: projectId,
      task_id: taskId,
      action_type: actionType,
      metadata: metadata || {},
    })

  if (error) {
    console.error('Failed to log activity:', error)
    throw error
  }
}

/**
 * Log time tracking activity
 */
export async function logTimeActivity(
  userId: string,
  projectId: string,
  taskId: string,
  duration: number,
  taskTitle: string,
  isManual: boolean = false
) {
  return logActivity(userId, projectId, taskId, 'time_logged', {
    duration,
    task_title: taskTitle,
    is_manual: isManual
  })
}

/**
 * Log project creation
 */
export async function logProjectCreated(
  userId: string,
  projectId: string,
  projectTitle: string
) {
  return logActivity(userId, projectId, null, 'project_created', {
    project_title: projectTitle
  })
}

/**
 * Log project update
 */
export async function logProjectUpdated(
  userId: string,
  projectId: string,
  projectTitle: string,
  changes: any
) {
  return logActivity(userId, projectId, null, 'project_updated', {
    project_title: projectTitle,
    changes
  })
}

/**
 * Log project deletion
 */
export async function logProjectDeleted(
  userId: string,
  projectId: string,
  projectTitle: string
) {
  return logActivity(userId, projectId, null, 'project_deleted', {
    project_title: projectTitle
  })
}

/**
 * Log task progress update
 */
export async function logTaskProgressUpdate(
  userId: string,
  projectId: string,
  taskId: string,
  oldProgress: number,
  newProgress: number,
  taskTitle: string
) {
  const isMilestone = [25, 50, 75, 100].includes(newProgress)
  const isSignificant = Math.abs(newProgress - oldProgress) >= 20
  
  const activityType = isMilestone ? 'task_progress_milestone' : 'task_progress_updated'
  
  return logActivity(userId, projectId, taskId, activityType, {
    old_progress: oldProgress,
    new_progress: newProgress,
    progress_change: newProgress - oldProgress,
    task_title: taskTitle,
    is_milestone: isMilestone,
    is_significant: isSignificant
  })
}