import { createClient } from '@/lib/supabase/server'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { PreferencesSettings } from '@/components/settings/PreferencesSettings'
import { AccountSettings } from '@/components/settings/AccountSettings'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <ProfileSettings user={user} />
      </div>

      <Separator />

      {/* Preferences Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <PreferencesSettings userId={user.id} />
      </div>

      <Separator />

      {/* Account Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <AccountSettings user={user} />
      </div>
    </div>
  )
}