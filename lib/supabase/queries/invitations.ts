import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Invitation = Database['public']['Tables']['invitations']['Row']

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export async function createInvitation(
  companyId: string,
  email: string,
  role: 'admin' | 'member',
  invitedBy: string
) {
  const supabase = createBrowserClient()
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      company_id: companyId,
      email,
      role,
      invited_by: invitedBy,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getInvitations(companyId: string, supabaseClient?: SupabaseClient<Database>) {
  const supabase = supabaseClient || createBrowserClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      invited_by_profile:profiles!invitations_invited_by_fkey(id, full_name, email, avatar_url)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function acceptInvitation(token: string, userId: string) {
  const supabase = createBrowserClient()

  // Find invitation by token
  const { data: invitation, error: findError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (findError || !invitation) {
    throw new Error('Invalid or expired invitation')
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    throw new Error('Invitation has expired')
  }

  // Add user to company
  const { error: memberError } = await supabase
    .from('company_members')
    .insert({
      company_id: invitation.company_id,
      user_id: userId,
      role: invitation.role,
    })

  if (memberError) throw memberError

  // Add to default team
  const { data: defaultTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('company_id', invitation.company_id)
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
    .update({ company_id: invitation.company_id })
    .eq('id', userId)

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  return invitation
}

export async function cancelInvitation(invitationId: string) {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) throw error
}
