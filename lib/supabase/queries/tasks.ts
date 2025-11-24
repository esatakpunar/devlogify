import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export async function getTasks(projectId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export async function getTask(id: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTask(task: TaskInsert, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create multiple tasks in a single batch operation
 */
export async function createTasks(tasks: TaskInsert[]) {
  const supabase = createBrowserClient()
  
  if (tasks.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasks)
    .select()

  if (error) throw error
  return data || []
}

export async function updateTask(id: string, updates: TaskUpdate) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(id: string) {
  const supabase = createBrowserClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'done') {
  const supabase = createBrowserClient()
  
  const updates: TaskUpdate = {
    status,
    ...(status === 'done' ? { completed_at: new Date().toISOString() } : { completed_at: null })
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTaskOrder(taskId: string, newOrder: number) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ order_index: newOrder })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTaskProgress(id: string, progress: number) {
  const supabase = createBrowserClient()
  
  // Ensure progress is within valid range
  const clampedProgress = Math.max(0, Math.min(100, progress))
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ progress: clampedProgress })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTasksOrder(taskUpdates: { id: string; order_index: number }[]) {
  const supabase = createBrowserClient()
  
  // For now, we'll disable batch updates to avoid multiple requests
  // This function is kept for future optimization
  return []
}

/**
 * Get recent incomplete tasks for dashboard
 */
export async function getRecentIncompleteTasks(userId: string, limit: number = 5, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects!inner(
        id,
        title,
        color
      )
    `)
    .eq('user_id', userId)
    .neq('status', 'done')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get tasks completed today for dashboard
 */
export async function getTodayCompletedTasks(userId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects!inner(
        id,
        title,
        color
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', today.toISOString())
    .lt('completed_at', tomorrow.toISOString())
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Add tags to multiple tasks
 */
export async function addTagsToTasks(taskIds: string[], tags: string[], supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  
  // Get current tasks
  const { data: existingTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('id, tags')
    .in('id', taskIds)

  if (fetchError) {
    console.error('Error fetching tasks:', fetchError)
    throw fetchError
  }
  
  if (!existingTasks || existingTasks.length === 0) {
    console.error('No tasks found for IDs:', taskIds)
    throw new Error(`Tasks not found for IDs: ${taskIds.join(', ')}`)
  }

  // Update each task with new tags (merge with existing)
  const updates = existingTasks.map(task => {
    const existingTags = (task.tags || []) as string[]
    const newTags = [...new Set([...existingTags, ...tags])] // Remove duplicates
    return {
      id: task.id,
      tags: newTags
    }
  })

  // Update tasks
  const updatePromises = updates.map(update =>
    supabase
      .from('tasks')
      .update({ tags: update.tags })
      .eq('id', update.id)
      .select()
  )

  const results = await Promise.all(updatePromises)
  
  // Check for errors
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.error) {
      console.error(`Error updating task ${updates[i].id} tags:`, result.error)
      throw result.error
    }
  }

  const updatedTasks = results.map(r => r.data).filter(Boolean).flat()
  
  return updatedTasks
}