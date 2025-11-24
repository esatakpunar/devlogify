import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RecurringTask = Database['public']['Tables']['recurring_tasks']['Row']
export type RecurringTaskInsert = Database['public']['Tables']['recurring_tasks']['Insert']
export type RecurringTaskUpdate = Database['public']['Tables']['recurring_tasks']['Update']

export async function getRecurringTasks(userId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*, project:projects(id, title, color), template:task_templates(id, title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getActiveRecurringTasks(userId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*, project:projects(id, title, color), template:task_templates(id, title)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_run_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getRecurringTask(id: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*, project:projects(id, title, color), template:task_templates(id, title)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createRecurringTask(task: RecurringTaskInsert) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('recurring_tasks')
    .insert(task)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRecurringTask(id: string, updates: RecurringTaskUpdate) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('recurring_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecurringTask(id: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('recurring_tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get recurring tasks that are due to be created
 * @param supabaseClient - Optional Supabase client (use service role for cron jobs)
 */
export async function getDueRecurringTasks(supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })

  if (error) throw error
  return data || []
}

