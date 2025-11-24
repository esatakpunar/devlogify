import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// Project with tasks count (for queries that join tasks)
export type ProjectWithTasks = Project & {
  tasks: { count: number }[]
}

export async function getProjects(userId: string, status?: string, supabaseClient?: SupabaseClient<Database>): Promise<ProjectWithTasks[]> {
  const supabase = supabaseClient || createBrowserClient()

  let query = supabase
    .from('projects')
    .select(`
      *,
      tasks:tasks(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ProjectWithTasks[]
}

export async function getProject(id: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProject(project: ProjectInsert) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(id: string, updates: ProjectUpdate) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProject(id: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Archive a project by updating its status
 */
export async function archiveProject(id: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get project count for a user by status
 */
export async function getProjectCount(userId: string, status?: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()

  let query = supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (status) {
    query = query.eq('status', status)
  }

  const { count, error } = await query

  if (error) throw error
  return count || 0
}

/**
 * Get projects with task relations for a specific user
 */
export async function getProjectsWithNotes(userId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get pinned projects for dashboard
 */
export async function getPinnedProjects(userId: string, supabaseClient?: SupabaseClient<Database>): Promise<ProjectWithTasks[]> {
  const supabase = supabaseClient || createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks:tasks(count)
      `)
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(6)

    if (error) throw error
    return data as ProjectWithTasks[]
  } catch (error: any) {
    // If is_pinned column doesn't exist yet, return empty array
    if (error.code === '42703') {
      console.warn('is_pinned column not found, returning empty pinned projects')
      return []
    }
    throw error
  }
}

/**
 * Toggle pin status for a project
 */
export async function toggleProjectPin(projectId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()

  try {
    // First get current pin status
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('is_pinned')
      .eq('id', projectId)
      .single()

    if (fetchError) throw fetchError

    if (!project) {
      throw new Error('Project not found')
    }

    const currentPinStatus = (project as { is_pinned: boolean }).is_pinned

    // Toggle the pin status - use updateProject if no client provided, otherwise use direct update
    if (supabaseClient) {
      const { data, error } = await (supabaseClient as any)
        .from('projects')
        .update({ is_pinned: !currentPinStatus })
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Use the helper function when no client is provided
      return await updateProject(projectId, { is_pinned: !currentPinStatus })
    }
  } catch (error: any) {
    // If is_pinned column doesn't exist yet, show error message
    if (error.code === '42703') {
      throw new Error('Project pinning feature is not available yet. Please run the database migration.')
    }
    throw error
  }
}