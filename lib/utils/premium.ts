import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

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

