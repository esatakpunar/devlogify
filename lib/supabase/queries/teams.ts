import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database, TeamMemberWithProfile } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

export async function createTeam(
  companyId: string,
  name: string,
  createdBy: string,
  description?: string,
  color?: string
) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('teams')
    .insert({
      company_id: companyId,
      name,
      description: description || null,
      color: color || '#6366f1',
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTeams(companyId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members:team_members(count)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getTeam(teamId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (error) throw error
  return data
}

export async function updateTeam(teamId: string, updates: Partial<TeamUpdate>) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('teams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTeam(teamId: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) throw error
}

export async function addTeamMember(teamId: string, userId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeTeamMember(teamId: string, userId: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getTeamMembers(teamId: string, supabaseClient?: SupabaseClient<Database>): Promise<TeamMemberWithProfile[]> {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      profile:profiles!inner(*)
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as unknown as TeamMemberWithProfile[]
}
