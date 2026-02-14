import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Returns the user's primary company based on membership table.
 * company_members is the source of truth for access control.
 */
export async function getUserCompanyIdFromMembership(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const { data: membershipData, error } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const data = membershipData as Pick<Database['public']['Tables']['company_members']['Row'], 'company_id'> | null

  if (error) throw error
  return data?.company_id || null
}

/**
 * Best-effort profile sync: keeps profiles.company_id aligned with membership.
 * Never throws on sync update errors to avoid blocking request flow.
 */
export async function syncProfileCompanyId(
  userId: string,
  companyId: string | null,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle()
  const profile = profileData as Pick<Database['public']['Tables']['profiles']['Row'], 'company_id'> | null

  if (profileError) throw profileError

  if ((profile?.company_id || null) === companyId) {
    return
  }

  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({ company_id: companyId })
    .eq('id', userId)

  if (updateError) {
    console.warn('Failed to sync profiles.company_id with membership:', updateError)
  }
}

export async function getUserCompanyId(
  userId: string,
  supabase: SupabaseClient<Database>,
  options?: { syncProfile?: boolean }
): Promise<string | null> {
  const companyId = await getUserCompanyIdFromMembership(userId, supabase)

  if (options?.syncProfile !== false) {
    await syncProfileCompanyId(userId, companyId, supabase)
  }

  return companyId
}
