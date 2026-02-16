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

export async function getProjectsBasic(
  companyId: string,
  status?: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<Pick<Project, 'id' | 'title' | 'description' | 'color' | 'status'>[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  let query = supabase
    .from('projects')
    .select('id, title, description, color, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Pick<Project, 'id' | 'title' | 'description' | 'color' | 'status'>[]
}

export async function getProjectOptions(
  companyId: string,
  status?: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<Pick<Project, 'id' | 'title' | 'color'>[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  let query = supabase
    .from('projects')
    .select('id, title, color')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Pick<Project, 'id' | 'title' | 'color'>[]
}

export async function getProjects(companyId: string, status?: string, supabaseClient?: SupabaseClient<Database>): Promise<ProjectWithTasks[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  let query = supabase
    .from('projects')
    .select(`
      *,
      tasks:tasks(count)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as ProjectWithTasks[]
}

export async function getProject(id: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProject(project: ProjectInsert) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(id: string, updates: ProjectUpdate) {
  const supabase = createBrowserClient() as any

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
  const supabase = createBrowserClient() as any

  // Remove project share links first to avoid dangling public links.
  const { error: shareDeleteError } = await supabase
    .from('shared_links')
    .delete()
    .eq('resource_type', 'project')
    .eq('resource_id', id)

  if (shareDeleteError) {
    throw shareDeleteError
  }

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
  const supabase = createBrowserClient() as any

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
 * Get project count for a company by status
 */
export async function getProjectCount(companyId: string, status?: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = (supabaseClient || createBrowserClient()) as any

  let query = supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  if (status) {
    query = query.eq('status', status)
  }

  const { count, error } = await query

  if (error) throw error
  return count || 0
}

/**
 * Get projects for notes (company-based)
 */
export async function getProjectsWithNotes(companyId: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get pinned projects for dashboard
 */
export async function getPinnedProjects(companyId: string, supabaseClient?: SupabaseClient<Database>): Promise<ProjectWithTasks[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks:tasks(count)
      `)
      .eq('company_id', companyId)
      .eq('is_pinned', true)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(6)

    if (error) throw error
    return data as ProjectWithTasks[]
  } catch (error: any) {
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
  const supabase = (supabaseClient || createBrowserClient()) as any

  try {
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
      return await updateProject(projectId, { is_pinned: !currentPinStatus })
    }
  } catch (error: any) {
    if (error.code === '42703') {
      throw new Error('Project pinning feature is not available yet. Please run the database migration.')
    }
    throw error
  }
}
