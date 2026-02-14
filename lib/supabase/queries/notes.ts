import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']

export async function getNotes(companyId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      project:projects(id, title, color)
    `)
    .eq('company_id', companyId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getNote(id: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      project:projects(id, title, color)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createNote(note: NoteInsert) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(id: string, updates: NoteUpdate) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteNote(id: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function togglePinNote(id: string, isPinned: boolean) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('notes')
    .update({ is_pinned: isPinned })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
