import { useState, useEffect } from 'react'
import { getProfile } from '@/lib/supabase/queries/profiles'
import { User } from '@supabase/supabase-js'

/**
 * Hook to check if user has premium subscription (client-side)
 * @param userId - User ID to check
 * @returns { isPremium: boolean, loading: boolean }
 */
export function usePremium(userId: string | undefined) {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const checkPremium = async () => {
      try {
        const profile = await getProfile(userId)
        setIsPremium(profile?.is_premium ?? false)
      } catch (error) {
        console.error('Error checking premium status:', error)
        setIsPremium(false)
      } finally {
        setLoading(false)
      }
    }

    checkPremium()
  }, [userId])

  return { isPremium, loading }
}

