import { createClient } from '@/lib/supabase/server'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { PreferencesSettings } from '@/components/settings/PreferencesSettings'
import { AccountSettings } from '@/components/settings/AccountSettings'
import { PremiumSettings } from '@/components/settings/PremiumSettings'
import { Separator } from '@/components/ui/separator'
import { SettingsPageContent } from '@/components/settings/SettingsPageContent'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return <SettingsPageContent user={user} />
}