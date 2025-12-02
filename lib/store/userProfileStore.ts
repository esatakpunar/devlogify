import { create } from 'zustand'
import { getProfile, type Profile } from '@/lib/supabase/queries/profiles'

interface UserProfileStore {
  profile: Profile | null
  isPremium: boolean
  isLoading: boolean
  fetchProfile: (userId: string) => Promise<void>
  setProfile: (profile: Profile | null) => void
  clearProfile: () => void
}

// Track pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<Profile | null>>()

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  isPremium: false,
  isLoading: false,

  fetchProfile: async (userId: string) => {
    // If profile already exists and matches userId, don't fetch again
    const currentProfile = get().profile
    if (currentProfile && currentProfile.id === userId) {
      return
    }

    // If already loading for this user, wait for existing request
    const pendingRequest = pendingRequests.get(userId)
    if (pendingRequest) {
      try {
        const profile = await pendingRequest
        if (profile && profile.id === userId) {
          set({
            profile,
            isPremium: profile?.is_premium ?? false,
            isLoading: false,
          })
        }
      } catch (error) {
        // If pending request fails, continue to make new request
      }
      return
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const profile = await getProfile(userId)
        return profile
      } catch (error) {
        console.error('Error fetching profile:', error)
        return null
      } finally {
        // Remove from pending requests
        pendingRequests.delete(userId)
      }
    })()

    // Store pending request
    pendingRequests.set(userId, requestPromise)

    set({ isLoading: true })
    try {
      const profile = await requestPromise
      if (profile && profile.id === userId) {
        set({
          profile,
          isPremium: profile?.is_premium ?? false,
          isLoading: false,
        })
      } else {
        set({
          profile: null,
          isPremium: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      set({
        profile: null,
        isPremium: false,
        isLoading: false,
      })
    }
  },

  setProfile: (profile: Profile | null) => {
    set({
      profile,
      isPremium: profile?.is_premium ?? false,
    })
  },

  clearProfile: () => {
    set({
      profile: null,
      isPremium: false,
      isLoading: false,
    })
    // Clear pending requests
    pendingRequests.clear()
  },
}))

