'use client'

import { useState } from 'react'
import { ProfileSettings } from './ProfileSettings'
import { PreferencesSettings } from './PreferencesSettings'
import { AccountSettings } from './AccountSettings'
import { PremiumSettings } from './PremiumSettings'
import { ShortcutsSettings } from './ShortcutsSettings'
import { DataExportImport } from './DataExportImport'
import { NotificationSettings } from './NotificationSettings'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { User } from '@supabase/supabase-js'
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Crown, 
  Keyboard, 
  Download, 
  Bell,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsPageContentProps {
  user: User
}

type SettingsTab = 'profile' | 'preferences' | 'notifications' | 'premium' | 'shortcuts' | 'data' | 'account'

export function SettingsPageContent({ user }: SettingsPageContentProps) {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs: { id: SettingsTab; label: string; icon: typeof UserIcon }[] = [
    { id: 'profile', label: t('settings.profile'), icon: UserIcon },
    { id: 'preferences', label: t('settings.preferences'), icon: SettingsIcon },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'premium', label: t('premium.title'), icon: Crown },
    { id: 'shortcuts', label: t('settings.shortcuts'), icon: Keyboard },
    { id: 'data', label: t('settings.data'), icon: Download },
    { id: 'account', label: t('account.title'), icon: Shield },
  ]

  return (
    <div className="w-full max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('settings.manageAccountAndPreferences')}
        </p>
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
          <div className="overflow-x-auto -mx-4 px-4 mb-4">
            <TabsList className="inline-flex w-auto min-w-full h-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex flex-col items-center gap-1 text-xs py-2.5 px-3 whitespace-nowrap">
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] leading-tight">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <ProfileSettings user={user} />
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <PreferencesSettings userId={user.id} />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <NotificationSettings userId={user.id} />
            </div>
          </TabsContent>

          <TabsContent value="premium" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <PremiumSettings userId={user.id} />
            </div>
          </TabsContent>

          <TabsContent value="shortcuts" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <ShortcutsSettings />
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <DataExportImport userId={user.id} />
            </div>
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <AccountSettings user={user} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="hidden md:flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2 sticky top-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-left">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('settings.profile')}</h2>
                <ProfileSettings user={user} />
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('settings.preferences')}</h2>
                <PreferencesSettings userId={user.id} />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <NotificationSettings userId={user.id} />
              </div>
            )}

            {activeTab === 'premium' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('premium.title')}</h2>
                <PremiumSettings userId={user.id} />
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div>
                <ShortcutsSettings />
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <DataExportImport userId={user.id} />
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('account.title')}</h2>
                <AccountSettings user={user} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
