import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TaskTemplate = Database['public']['Tables']['task_templates']['Row']
export type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert']
export type TaskTemplateUpdate = Database['public']['Tables']['task_templates']['Update']

export async function getTaskTemplates(userId: string, companyId?: string | null) {
  const supabase = createBrowserClient() as any

  let query = supabase
    .from('task_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getTaskTemplate(id: string) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTaskTemplate(template: TaskTemplateInsert) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('task_templates')
    .insert(template)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTaskTemplate(id: string, updates: TaskTemplateUpdate) {
  const supabase = createBrowserClient() as any

  const { data, error } = await supabase
    .from('task_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTaskTemplate(id: string) {
  const supabase = createBrowserClient() as any

  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}
