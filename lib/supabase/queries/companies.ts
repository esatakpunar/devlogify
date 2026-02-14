import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database, CompanyMemberWithProfile } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type CompanyMember = Database['public']['Tables']['company_members']['Row']

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function createCompany(
  name: string,
  ownerId: string,
  supabaseClient?: SupabaseClient<Database>
) {
  const supabase = supabaseClient || createBrowserClient()
  const slug = generateSlug(name) + '-' + Date.now().toString(36)
  const joinCode = generateJoinCode()

  // Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name,
      slug,
      join_code: joinCode,
      owner_id: ownerId,
    })
    .select()
    .single()

  if (companyError) throw companyError

  // Add owner as admin member (user_id = auth.uid() policy allows this)
  const { error: memberError } = await supabase
    .from('company_members')
    .insert({
      company_id: company.id,
      user_id: ownerId,
      role: 'admin',
    })

  if (memberError) throw memberError

  // Update profile with company_id BEFORE creating teams
  // (team/team_member policies check profiles.company_id)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ company_id: company.id })
    .eq('id', ownerId)

  if (profileError) throw profileError

  // Create default "General" team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      company_id: company.id,
      name: 'General',
      description: 'Default team for all members',
      created_by: ownerId,
    })
    .select()
    .single()

  if (teamError) throw teamError

  // Add owner to default team
  const { error: teamMemberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: ownerId,
    })

  if (teamMemberError) throw teamMemberError

  return company
}

export async function getCompany(companyId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) throw error
  return data
}

export async function updateCompany(companyId: string, updates: CompanyUpdate) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCompanyMembers(companyId: string, supabaseClient?: SupabaseClient<Database>): Promise<CompanyMemberWithProfile[]> {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('company_members')
    .select(`
      *,
      profile:profiles!inner(*)
    `)
    .eq('company_id', companyId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as unknown as CompanyMemberWithProfile[]
}

export async function updateMemberRole(memberId: string, role: 'admin' | 'member') {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('company_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeMember(companyId: string, userId: string) {
  const supabase = createBrowserClient()

  // Remove from all teams in this company
  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('company_id', companyId)

  if (teams) {
    const teamIds = teams.map(t => t.id)
    if (teamIds.length > 0) {
      await supabase
        .from('team_members')
        .delete()
        .in('team_id', teamIds)
        .eq('user_id', userId)
    }
  }

  // Remove from company
  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_id', userId)

  if (error) throw error

  // Clear company_id from profile
  const { error: clearProfileError } = await supabase
    .from('profiles')
    .update({ company_id: null })
    .eq('id', userId)

  if (clearProfileError) {
    console.warn('Failed to clear profile company_id after member removal:', clearProfileError)
  }
}

export async function joinByCode(joinCode: string, userId: string) {
  const supabase = createBrowserClient()

  // Find company by join code
  const { data: company, error: findError } = await supabase
    .from('companies')
    .select('id')
    .eq('join_code', joinCode.toUpperCase())
    .single()

  if (findError || !company) {
    throw new Error('Invalid join code')
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('company_members')
    .select('id')
    .eq('company_id', company.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    throw new Error('Already a member of this company')
  }

  // Add as member
  const { error: memberError } = await supabase
    .from('company_members')
    .insert({
      company_id: company.id,
      user_id: userId,
      role: 'member',
    })

  if (memberError) throw memberError

  // Add to default (General) team
  const { data: defaultTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('company_id', company.id)
    .eq('name', 'General')
    .single()

  if (defaultTeam) {
    await supabase
      .from('team_members')
      .insert({
        team_id: defaultTeam.id,
        user_id: userId,
      })
  }

  // Update profile with company_id
  await supabase
    .from('profiles')
    .update({ company_id: company.id })
    .eq('id', userId)

  return company
}

export async function regenerateJoinCode(companyId: string) {
  const supabase = createBrowserClient()
  const newCode = generateJoinCode()

  const { data, error } = await supabase
    .from('companies')
    .update({ join_code: newCode })
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}
