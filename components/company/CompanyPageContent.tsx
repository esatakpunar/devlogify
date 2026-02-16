'use client'

import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/lib/store/companyStore'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CompanySettings } from './CompanySettings'
import { MembersManager } from './MembersManager'
import { TeamsManager } from './TeamsManager'
import { SprintsManager } from './SprintsManager'
import { InvitationsManager } from './InvitationsManager'
import { ActivityLogs } from './ActivityLogs'
import {
  Settings,
  Users,
  FolderKanban,
  CalendarRange,
  Mail,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompanyPageContentProps {
  userId: string
  companyId: string
}

type CompanyTab = 'general' | 'members' | 'teams' | 'sprints' | 'invitations' | 'activity'

export function CompanyPageContent({ userId, companyId }: CompanyPageContentProps) {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState<CompanyTab>('general')
  const { company, isLoading, fetchCompany, fetchMembers, fetchTeams, getCurrentUserRole } = useCompanyStore()

  useEffect(() => {
    fetchCompany(companyId)
    fetchMembers(companyId)
    fetchTeams(companyId)
  }, [companyId, fetchCompany, fetchMembers, fetchTeams])

  const currentUserRole = getCurrentUserRole(userId)
  const isAdmin = currentUserRole === 'admin'

  const tabs: { id: CompanyTab; label: string; icon: typeof Settings }[] = [
    { id: 'general', label: t('company.general'), icon: Settings },
    { id: 'members', label: t('company.members'), icon: Users },
    { id: 'teams', label: t('company.teams'), icon: FolderKanban },
    { id: 'sprints', label: t('kanban.sprint'), icon: CalendarRange },
    { id: 'invitations', label: t('company.invitations'), icon: Mail },
    { id: 'activity', label: t('company.activity'), icon: Activity },
  ]

  if (isLoading && !company) {
    return (
      <div className="w-full max-w-full mx-auto">
        <div className="mb-6">
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{company?.name || t('company.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('company.settingsDescription')}
        </p>
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CompanyTab)}>
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

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                {tab.id === 'general' && <CompanySettings companyId={companyId} isAdmin={isAdmin} />}
                {tab.id === 'members' && <MembersManager companyId={companyId} userId={userId} isAdmin={isAdmin} />}
                {tab.id === 'teams' && <TeamsManager companyId={companyId} userId={userId} isAdmin={isAdmin} />}
                {tab.id === 'sprints' && <SprintsManager companyId={companyId} userId={userId} isAdmin={isAdmin} />}
                {tab.id === 'invitations' && <InvitationsManager companyId={companyId} userId={userId} isAdmin={isAdmin} />}
                {tab.id === 'activity' && <ActivityLogs companyId={companyId} />}
              </div>
            </TabsContent>
          ))}
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
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('company.general')}</h2>
                <CompanySettings companyId={companyId} isAdmin={isAdmin} />
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('company.members')}</h2>
                <MembersManager companyId={companyId} userId={userId} isAdmin={isAdmin} />
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('company.teams')}</h2>
                <TeamsManager companyId={companyId} userId={userId} isAdmin={isAdmin} />
              </div>
            )}

            {activeTab === 'sprints' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('kanban.sprint')}</h2>
                <SprintsManager companyId={companyId} userId={userId} isAdmin={isAdmin} />
              </div>
            )}

            {activeTab === 'invitations' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('company.invitations')}</h2>
                <InvitationsManager companyId={companyId} userId={userId} isAdmin={isAdmin} />
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('company.activity')}</h2>
                <ActivityLogs companyId={companyId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
