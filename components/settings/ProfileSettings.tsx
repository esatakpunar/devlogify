'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'
import { updateProfile, createProfile, Profile } from '@/lib/supabase/queries/profiles'
import { useUserProfileStore } from '@/lib/store/userProfileStore'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProfileSettingsProps {
  user: User
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { profile: storeProfile, fetchProfile } = useUserProfileStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const t = useTranslation()

  useEffect(() => {
    const loadProfile = async () => {
      // First try to get from store
      if (storeProfile && storeProfile.id === user.id) {
        setProfile(storeProfile)
        setFullName(storeProfile.full_name || '')
        setInitialLoading(false)
        return
      }

      // If not in store, fetch it (shouldn't happen if DashboardLayout loaded properly)
      try {
        await fetchProfile(user.id)
        // Wait a bit for store to update, then check again
        setTimeout(() => {
          const updatedProfile = useUserProfileStore.getState().profile
          if (updatedProfile && updatedProfile.id === user.id) {
            setProfile(updatedProfile)
            setFullName(updatedProfile.full_name || '')
          } else {
            // Fallback to user metadata if profile doesn't exist yet
            setFullName(user.user_metadata?.full_name || '')
          }
          setInitialLoading(false)
        }, 100)
      } catch (error) {
        console.error('Failed to load profile:', error)
        // Fallback to user metadata
        setFullName(user.user_metadata?.full_name || '')
        setInitialLoading(false)
      }
    }

    loadProfile()
  }, [user.id, user.user_metadata?.full_name, storeProfile, fetchProfile])

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let updatedProfile: Profile
      if (profile) {
        // Update existing profile
        updatedProfile = await updateProfile(user.id, {
          full_name: fullName
        })
      } else {
        updatedProfile = await createProfile(user.id, user.email || '', fullName)
      }
      
      setProfile(updatedProfile)
      // Update store
      useUserProfileStore.getState().setProfile(updatedProfile)

      toast.success(t('profile.profileUpdatedSuccessfully'))
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error(t('profile.failedToUpdateProfile'))
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarFallback className="bg-blue-600 text-white text-2xl">
            {getInitials(user.email || '')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{fullName || t('profile.user')}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full-name">{t('profile.fullName')}</Label>
        <Input
          id="full-name"
          placeholder={t('profile.enterYourName')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">{t('profile.email')}</Label>
        <Input
          id="email"
          type="email"
          value={user.email || ''}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">
          {t('profile.emailCannotBeChanged')}
        </p>
      </div>

      {/* Save Button */}
      <Button type="submit" disabled={loading}>
        {loading ? t('projects.saving') : t('projects.saveChanges')}
      </Button>
    </form>
  )
}