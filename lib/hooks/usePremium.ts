import { useUserProfileStore } from '@/lib/store/userProfileStore'

/**
 * Hook to check if user has premium subscription (client-side)
 * Reads from global userProfileStore - profile should be fetched once on login in DashboardLayout
 * This hook does NOT trigger fetches - it only reads from store
 * @param userId - User ID to check
 * @returns { isPremium: boolean, loading: boolean }
 */
export function usePremium(userId: string | undefined) {
  const { isPremium, isLoading, profile } = useUserProfileStore()

  // Only return premium status if profile exists and matches userId
  const isValid = userId && profile && profile.id === userId

  return { 
    isPremium: isValid ? isPremium : false, 
    loading: userId ? isLoading : false 
  }
}

