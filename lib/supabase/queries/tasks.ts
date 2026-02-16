import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Task with project information (for dashboard queries)
export type TaskWithProject = Task & {
  project: {
    id: string
    title: string
    color: string
  }
}

// Task with assignee/responsible profile info
export type TaskWithAssignees = Task & {
  assignee?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
  responsible?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
}

export type TaskWithProjectAndAssignees = TaskWithProject & {
  assignee?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
  responsible?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
}

export type TaskWithDetails = Task & {
  project: {
    id: string
    title: string
    color: string
    status?: string
  } | null
  assignee?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
  responsible?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
}

export async function getTasks(projectId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email),
      responsible:profiles!tasks_responsible_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as TaskWithAssignees[]
}

/**
 * Get all tasks in a company across all projects (only active projects)
 */
export async function getCompanyTasks(companyId: string, supabaseClient?: SupabaseClient<Database>): Promise<TaskWithDetails[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      project_id,
      user_id,
      title,
      description,
      status,
      priority,
      estimated_duration,
      actual_duration,
      progress,
      task_number,
      order_index,
      tags,
      completed_at,
      company_id,
      assignee_id,
      responsible_id,
      review_status,
      review_note,
      created_at,
      updated_at,
      project:projects!inner(id, title, color, status),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email),
      responsible:profiles!tasks_responsible_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('company_id', companyId)
    .eq('project.status', 'active')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as TaskWithDetails[]
}

export async function getTask(id: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email),
      responsible:profiles!tasks_responsible_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TaskWithAssignees
}

export async function createTask(task: TaskInsert, supabaseClient?: SupabaseClient<Database>) {
  const supabase = (supabaseClient || createBrowserClient()) as any

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
  const supabase = createBrowserClient() as any

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
  const supabase = createBrowserClient() as any

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
  const supabase = createBrowserClient() as any

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'done') {
  const supabase = createBrowserClient() as any

  const updates: TaskUpdate = {
    status,
    ...(status === 'done'
      ? {
          completed_at: new Date().toISOString(),
          progress: 100
        }
      : { completed_at: null })
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
  const supabase = createBrowserClient() as any

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
  const supabase = createBrowserClient() as any

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
  const supabase = createBrowserClient() as any

  if (taskUpdates.length === 0) {
    return []
  }

  // Prefer a single RPC call for better network/database efficiency.
  const { error: rpcError } = await supabase.rpc('bulk_update_task_order', {
    order_updates: taskUpdates,
  })

  if (!rpcError) {
    const updatedIds = taskUpdates.map((task) => task.id)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('id', updatedIds)

    if (error) throw error
    return (data || []) as Task[]
  }

  // Fallback for environments where RPC is not deployed yet.
  const updatePromises = taskUpdates.map(({ id, order_index }) =>
    supabase
      .from('tasks')
      .update({ order_index })
      .eq('id', id)
      .select()
      .single()
  )

  const results = await Promise.all(updatePromises)
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.error) {
      console.error(`Error updating task ${taskUpdates[i].id} order:`, result.error)
      throw result.error
    }
  }

  return results.map((r: any) => r.data).filter(Boolean) as Task[]
}

/**
 * Get recent incomplete tasks for dashboard (company-based, only active projects)
 */
export async function getRecentIncompleteTasks(companyId: string, limit: number = 5, supabaseClient?: SupabaseClient<Database>): Promise<TaskWithProjectAndAssignees[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      project_id,
      user_id,
      title,
      description,
      status,
      priority,
      estimated_duration,
      actual_duration,
      progress,
      task_number,
      order_index,
      tags,
      completed_at,
      company_id,
      assignee_id,
      responsible_id,
      review_status,
      review_note,
      created_at,
      updated_at,
      project:projects!inner(id, title, color, status)
    `)
    .eq('company_id', companyId)
    .eq('project.status', 'active')
    .neq('status', 'done')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as TaskWithProjectAndAssignees[]
}

/**
 * Get tasks completed today for dashboard (company-based, only active projects)
 */
export async function getTodayCompletedTasks(companyId: string, supabaseClient?: SupabaseClient<Database>): Promise<TaskWithProjectAndAssignees[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      project_id,
      user_id,
      title,
      description,
      status,
      priority,
      estimated_duration,
      actual_duration,
      progress,
      task_number,
      order_index,
      tags,
      completed_at,
      company_id,
      assignee_id,
      responsible_id,
      review_status,
      review_note,
      created_at,
      updated_at,
      project:projects!inner(id, title, color, status)
    `)
    .eq('company_id', companyId)
    .eq('project.status', 'active')
    .eq('status', 'done')
    .gte('completed_at', today.toISOString())
    .lt('completed_at', tomorrow.toISOString())
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data as TaskWithProjectAndAssignees[]
}

/**
 * Get tasks assigned to a specific user (only from active projects)
 */
export async function getMyTasks(userId: string, companyId: string, supabaseClient?: SupabaseClient<Database>): Promise<TaskWithProjectAndAssignees[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects!inner(id, title, color, status),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email),
      responsible:profiles!tasks_responsible_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('company_id', companyId)
    .eq('project.status', 'active')
    .eq('assignee_id', userId)
    .neq('status', 'done')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as TaskWithProjectAndAssignees[]
}

/**
 * Get tasks waiting for review by a specific responsible user (only from active projects)
 */
export async function getTasksToReview(userId: string, companyId: string, supabaseClient?: SupabaseClient<Database>): Promise<TaskWithProjectAndAssignees[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects!inner(id, title, color, status),
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, email),
      responsible:profiles!tasks_responsible_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('company_id', companyId)
    .eq('project.status', 'active')
    .eq('responsible_id', userId)
    .eq('review_status', 'pending')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as TaskWithProjectAndAssignees[]
}

/**
 * Approve a task (by responsible)
 */
export async function approveTask(taskId: string, userId: string, note?: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('tasks')
    .update({
      review_status: 'approved',
      review_note: note || null,
    })
    .eq('id', taskId)
    .eq('responsible_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reject a task (by responsible)
 */
export async function rejectTask(taskId: string, userId: string, note?: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('tasks')
    .update({
      review_status: 'rejected',
      review_note: note || null,
    })
    .eq('id', taskId)
    .eq('responsible_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Request changes on a task (by responsible)
 */
export async function requestChanges(taskId: string, userId: string, note?: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('tasks')
    .update({
      review_status: 'changes_requested',
      review_note: note || null,
      status: 'in_progress',
    })
    .eq('id', taskId)
    .eq('responsible_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Submit task for review (by assignee, moves to done with pending review)
 */
export async function submitForReview(taskId: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      review_status: 'pending',
      completed_at: new Date().toISOString(),
      progress: 100,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Add tags to multiple tasks
 */
export async function addTagsToTasks(taskIds: string[], tags: string[], supabaseClient?: SupabaseClient<Database>) {
  const supabase = (supabaseClient || createBrowserClient()) as any

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

  const updates = existingTasks.map((task: { id: string; tags: string[] | null }) => {
    const existingTags = (task.tags || []) as string[]
    const newTags = [...new Set([...existingTags, ...tags])]
    return {
      id: task.id,
      tags: newTags
    }
  })

  const updatePromises = updates.map((update: { id: string; tags: string[] }) =>
    supabase
      .from('tasks')
      .update({ tags: update.tags })
      .eq('id', update.id)
      .select()
  )

  const results = await Promise.all(updatePromises)

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
