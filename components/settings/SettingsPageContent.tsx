'use client'

import { ProfileSettings } from './ProfileSettings'
import { PreferencesSettings } from './PreferencesSettings'
import { AccountSettings } from './AccountSettings'
import { PremiumSettings } from './PremiumSettings'
import { ShortcutsSettings } from './ShortcutsSettings'
import { DataExportImport } from './DataExportImport'
import { NotificationSettings } from './NotificationSettings'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { User } from '@supabase/supabase-js'

interface SettingsPageContentProps {
  user: User
}

export function SettingsPageContent({ user }: SettingsPageContentProps) {
  const t = useTranslation()

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-1">
          {t('settings.manageAccountAndPreferences') || 'Manage your account and preferences'}
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('settings.profile')}</h2>
        <ProfileSettings user={user} />
      </div>

      <Separator />

      {/* Preferences Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('settings.preferences')}</h2>
        <PreferencesSettings userId={user.id} />
      </div>

      <Separator />

      {/* Premium Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('premium.title')}</h2>
        <PremiumSettings userId={user.id} />
      </div>

      <Separator />

      {/* Shortcuts Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <ShortcutsSettings />
      </div>

      <Separator />

      {/* Data Export/Import Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <DataExportImport userId={user.id} />
      </div>

      <Separator />

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <NotificationSettings userId={user.id} />
      </div>

      <Separator />

      {/* Account Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">{t('account.title')}</h2>
        <AccountSettings user={user} />
      </div>
    </div>
  )
}

