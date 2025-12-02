import { createClient as createServerClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { generateShareToken } from '@/lib/utils/sharing'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface SharedLink {
  id: string
  user_id: string
  resource_type: 'project' | 'analytics'
  resource_id: string
  token: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  view_count: number
}

/**
 * Create a share link
 */
export async function createShareLink(
  userId: string,
  resourceType: 'project' | 'analytics',
  resourceId: string,
  expiresAt?: Date
): Promise<SharedLink> {
  const supabase = await createServerClient()
  
  const token = generateShareToken()
  
  const { data, error } = await supabase
    .from('shared_links')
    .insert({
      user_id: userId,
      resource_type: resourceType,
      resource_id: resourceId,
      token,
      is_active: true,
      expires_at: expiresAt?.toISOString() || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create share link: ${error.message}`)
  }

  return data
}

/**
 * Get share link by token (public access)
 */
export async function getShareLinkByToken(token: string, supabaseClient?: SupabaseClient<Database>): Promise<SharedLink | null> {
  // Use public client for anonymous access
  const supabase = supabaseClient || createPublicClient()
  
  const { data, error } = await supabase
    .from('shared_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  return data
}

/**
 * Get share links for a user
 */
export async function getUserShareLinks(
  userId: string,
  resourceType?: 'project' | 'analytics'
): Promise<SharedLink[]> {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('shared_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (resourceType) {
    query = query.eq('resource_type', resourceType)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get share links: ${error.message}`)
  }

  return data || []
}

/**
 * Update share link view count (public access)
 */
export async function incrementShareLinkViews(token: string, supabaseClient?: SupabaseClient<Database>): Promise<void> {
  // Use public client for anonymous access
  const supabase = supabaseClient || createPublicClient()
  
  const { error } = await supabase.rpc('increment_share_link_views', {
    link_token: token,
  })

  if (error) {
    // If RPC doesn't exist, manually update
    const { data } = await supabase
      .from('shared_links')
      .select('view_count')
      .eq('token', token)
      .single()

    if (data) {
      await supabase
        .from('shared_links')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('token', token)
    }
  }
}

/**
 * Deactivate share link
 */
export async function deactivateShareLink(token: string, userId: string): Promise<void> {
  const supabase = await createServerClient()
  
  const { error } = await supabase
    .from('shared_links')
    .update({ is_active: false })
    .eq('token', token)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to deactivate share link: ${error.message}`)
  }
}

