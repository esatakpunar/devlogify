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

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface TaskQueryOptions {
  limit?: number
  offset?: number
  statusFilter?: TaskStatus[]
  projectIds?: string[]
  sprintId?: string | null
}

const MAX_ESTIMATED_DURATION = 9999
const MAX_TAGS_PER_TASK = 20
const MAX_TAG_LENGTH = 32

function validateEstimatedDuration(value: number | null | undefined) {
  if (value === null || value === undefined) return
  if (!Number.isInteger(value) || value < 1 || value > MAX_ESTIMATED_DURATION) {
    throw new Error(`Estimated duration must be an integer between 1 and ${MAX_ESTIMATED_DURATION}`)
  }
}

function normalizeTags(tags: string[] | null | undefined): string[] | null {
  if (!tags || tags.length === 0) return null

  const normalized = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  )

  if (normalized.length > MAX_TAGS_PER_TASK) {
    throw new Error(`A task can have at most ${MAX_TAGS_PER_TASK} tags`)
  }

  for (const tag of normalized) {
    if (tag.length > MAX_TAG_LENGTH) {
      throw new Error(`Each tag can be at most ${MAX_TAG_LENGTH} characters`)
    }
  }

  return normalized
}

function getStatusTransitionUpdates(status: TaskStatus): TaskUpdate {
  if (status === 'done') {
    return {
      status,
      completed_at: new Date().toISOString(),
      progress: 100,
    }
  }

  return {
    status,
    completed_at: null,
    progress: status === 'in_progress' ? 50 : 0,
    review_status: null,
    review_note: null,
  }
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
 * Get company tasks with bounded pagination for free-plan friendly reads.
 */
export async function getCompanyTasks(
  companyId: string,
  options: TaskQueryOptions = {},
  supabaseClient?: SupabaseClient<Database>
): Promise<TaskWithDetails[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  let query = supabase
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
      sprint_id,
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

  if (options.statusFilter && options.statusFilter.length > 0) {
    query = query.in('status', options.statusFilter)
  }

  if (options.projectIds && options.projectIds.length > 0) {
    query = query.in('project_id', options.projectIds)
  }

  if (options.sprintId !== undefined) {
    if (options.sprintId === null) {
      query = query.is('sprint_id', null)
    } else {
      query = query.eq('sprint_id', options.sprintId)
    }
  }

  const limit = Math.min(Math.max(options.limit || 200, 1), 500)
  const offset = Math.max(options.offset || 0, 0)

  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error } = await query

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
  validateEstimatedDuration(task.estimated_duration)

  const normalizedTags = normalizeTags(task.tags || null)
  const taskStatus = task.status || 'todo'
  const nextTask: TaskInsert = {
    ...task,
    tags: normalizedTags,
  }

  if (nextTask.order_index === undefined || nextTask.order_index === null) {
    const { data: lastTask, error: orderError } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('project_id', task.project_id)
      .eq('status', taskStatus)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (orderError) throw orderError
    nextTask.order_index = (lastTask?.order_index ?? -1) + 1
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(nextTask)
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
  validateEstimatedDuration(updates.estimated_duration)

  const nextUpdates: TaskUpdate = {
    ...updates,
  }

  if (updates.tags !== undefined) {
    nextUpdates.tags = normalizeTags(updates.tags)
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(nextUpdates)
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

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = createBrowserClient() as any

  const updates = getStatusTransitionUpdates(status)

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
      sprint_id,
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
      sprint_id,
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
export async function submitForReview(taskId: string, userId: string) {
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
    .eq('assignee_id', userId)
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
  const normalizedTags = normalizeTags(tags) || []
  if (taskIds.length === 0 || normalizedTags.length === 0) {
    return []
  }

  // Prefer a single SQL statement to avoid N+1 update overhead.
  const { data: rpcData, error: rpcError } = await supabase.rpc('append_tags_to_tasks', {
    task_ids: taskIds,
    tags_to_add: normalizedTags,
  })

  if (!rpcError) {
    return rpcData || []
  }

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
    const newTags = normalizeTags([...existingTags, ...normalizedTags]) || []
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
