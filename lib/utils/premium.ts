import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

/**
 * Check if user has premium subscription (server-side)
 * @param userId - User ID to check
 * @param supabaseClient - Optional Supabase client (if already created)
 * @returns Promise<boolean> - True if user is premium, false otherwise
 */
export async function checkIsPremium(
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<boolean> {
  try {
    const supabase = supabaseClient || await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking premium status:', error)
      return false
    }

    return data?.is_premium ?? false
  } catch (error) {
    console.error('Error checking premium status:', error)
    return false
  }
}

/**
 * Get user's language preference (server-side)
 * @param userId - User ID to check
 * @param supabaseClient - Optional Supabase client (if already created)
 * @returns Promise<Locale> - User's language preference or default locale
 */
export async function getUserLocale(
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<Locale> {
  try {
    const supabase = supabaseClient || await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error getting user locale:', error)
      return defaultLocale
    }

    // Validate locale
    const locale = data?.language
    if (locale && (locale === 'tr' || locale === 'en' || locale === 'de' || locale === 'es')) {
      return locale as Locale
    }

    return defaultLocale
  } catch (error) {
    console.error('Error getting user locale:', error)
    return defaultLocale
  }
}

