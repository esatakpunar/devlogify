import { createClient as createBrowserClient } from '@/lib/supabase/client'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  timezone: string
  theme: 'light' | 'dark' | 'system'
  notifications_enabled: boolean
  week_starts_on: 'monday' | 'sunday'
  language: 'tr' | 'en' | 'de' | 'es'
  is_premium: boolean
  company_id: string | null
  created_at: string
  updated_at: string
}

export type ProfileUpdate = {
  full_name?: string | null
  avatar_url?: string | null
  timezone?: string
  theme?: 'light' | 'dark' | 'system'
  notifications_enabled?: boolean
  week_starts_on?: 'monday' | 'sunday'
  language?: 'tr' | 'en' | 'de' | 'es'
  company_id?: string | null
}

/**
 * Get user profile (client-side)
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as Profile | null
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Create user profile (usually called after signup)
 */
export async function createProfile(
  userId: string,
  email: string,
  fullName?: string,
  additionalData?: Partial<ProfileUpdate>
): Promise<Profile> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName || null,
      ...additionalData,
    })
    .select()
    .single()

  if (error) throw error
  return data as Profile
}
