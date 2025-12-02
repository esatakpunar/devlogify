'use client'

import { useState } from 'react'
import { FolderKanban, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { RecentTasks } from '@/components/dashboard/RecentTasks'
import { TodayCompleted } from '@/components/dashboard/TodayCompleted'
import { PinnedProjects } from '@/components/dashboard/PinnedProjects'
import { QuickTimerCard } from '@/components/dashboard/QuickTimerCard'
import { TaskSuggestions } from '@/components/dashboard/TaskSuggestions'
import { DailyStandup } from '@/components/dashboard/DailyStandup'
import { PomodoroTimer } from '@/components/timer/PomodoroTimer'
import { MobileTimer } from '@/components/timer/MobileTimer'
import { AIFeaturesPromo } from '@/components/dashboard/AIFeaturesPromo'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { ProjectWithTasks } from '@/lib/supabase/queries/projects'
import type { TaskWithProject } from '@/lib/supabase/queries/tasks'

interface DashboardContentProps {
  user: {
    id: string
    email?: string
  }
  projectCount: number
  todayStats: {
    tasksCompleted: number
    totalMinutes: number
  }
  weeklyStats: {
    currentWeek: {
      minutes: number
    }
  }
  recentTasks: TaskWithProject[]
  todayCompletedTasks: TaskWithProject[]
  pinnedProjects: ProjectWithTasks[]
}

export function DashboardContent({
  user,
  projectCount,
  todayStats,
  weeklyStats,
  recentTasks,
  todayCompletedTasks,
  pinnedProjects,
}: DashboardContentProps) {
  const t = useTranslation()
  const router = useRouter()
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)

  const handleProjectCreated = () => {
    router.refresh()
  }

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const stats = [
    {
      title: t('dashboard.activeProjects'),
      value: projectCount || 0,
      icon: FolderKanban,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: t('dashboard.tasksToday'),
      value: todayStats.tasksCompleted,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: t('dashboard.timeToday'),
      value: formatTime(todayStats.totalMinutes),
      icon: Clock,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: t('dashboard.thisWeek'),
      value: formatTime(weeklyStats.currentWeek.minutes),
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  const userName = user?.email?.split('@')[0] || ''

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.welcomeBack', { name: userName })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <AnimatedCard key={stat.title} delay={index * 0.1}>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 dark:text-white truncate">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          <DailyStandup userId={user.id} />
          <RecentTasks tasks={recentTasks || []} userId={user.id} />
          <TodayCompleted tasks={todayCompletedTasks || []} />
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Desktop Timer */}
          <div className="hidden md:block">
            <PomodoroTimer />
          </div>
          
          {/* Mobile Timer */}
          <div className="md:hidden">
            <MobileTimer />
          </div>
          
          <QuickTimerCard userId={user.id} />
          <PinnedProjects projects={pinnedProjects || []} userId={user.id} />
          <AIFeaturesPromo userId={user.id} />
          <TaskSuggestions userId={user.id} />
        </div>
      </div>

      {/* Getting Started */}
      {projectCount === 0 && (
        <AnimatedCard delay={0.8}>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-2 dark:text-white">🚀 {t('dashboard.getStarted')}</h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              {t('dashboard.getStartedDescription')}
            </p>
            <Button onClick={() => setCreateProjectDialogOpen(true)} className="w-full sm:w-auto">
              {t('dashboard.createFirstProject')}
            </Button>
          </div>
        </AnimatedCard>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        userId={user.id}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

