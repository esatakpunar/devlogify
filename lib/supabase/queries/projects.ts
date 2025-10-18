import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export async function getProjects(userId: string, status?: string, supabaseClient?: SupabaseClient<Database>) {
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
  return data
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