'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'

interface ProfileSettingsProps {
  user: User
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [email, setEmail] = useState(user.email || '')
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) throw error

      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarFallback className="bg-blue-600 text-white text-2xl">
            {getInitials(email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{fullName || 'User'}</h3>
          <p className="text-sm text-gray-600">{email}</p>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full-name">Full Name</Label>
        <Input
          id="full-name"
          placeholder="Enter your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">
          Email cannot be changed. Contact support if needed.
        </p>
      </div>

      {/* Save Button */}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}