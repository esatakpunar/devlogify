'use client'

import { useState } from 'react'
import { WeeklySummary } from './WeeklySummary'
import { TimeChart } from './TimeChart'
import { ProjectDistribution } from './ProjectDistribution'
import { ProductivityInsights } from './ProductivityInsights'
import { HabitTracker } from './HabitTracker'
import { ProductivityScore } from './ProductivityScore'
import { GoalSetting } from './GoalSetting'
import { HeatmapCalendar } from './HeatmapCalendar'
import { TimeComparison } from './TimeComparison'
import { TimeInsights } from './TimeInsights'
import { TimeBlocking } from '@/components/timer/TimeBlocking'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Clock, Target, TrendingUp } from 'lucide-react'

interface AnalyticsPageContentProps {
  weeklyStats: {
    currentWeek: {
      minutes: number
      tasks: number
    }
    lastWeek: {
      minutes: number
      tasks: number
    }
  }
  dailyTime: Array<{
    day: string
    minutes: number
  }>
  projectDistribution: Array<{
    title: string
    color: string
    minutes: number
  }>
  mostProductiveDay: {
    day: string
    minutes: number
  }
  avgTaskDuration: number
  userId: string
}

export function AnalyticsPageContent({
  weeklyStats,
  dailyTime,
  projectDistribution,
  mostProductiveDay,
  avgTaskDuration,
  userId,
}: AnalyticsPageContentProps) {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t('analytics.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t('analytics.description')}
        </p>
      </div>

      {/* Featured Metrics - Always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <WeeklySummary stats={weeklyStats} />
        <ProductivityScore userId={userId} />
      </div>

      {/* Tabs for organized content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('analytics.overview') || 'Overview'}</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{t('analytics.timeAnalysis') || 'Time Analysis'}</span>
          </TabsTrigger>
          <TabsTrigger value="productivity" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">{t('analytics.productivity') || 'Productivity'}</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{t('analytics.goals') || 'Goals'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <TimeChart data={dailyTime} userId={userId} />
            <ProjectDistribution data={projectDistribution} userId={userId} />
          </div>
          <ProductivityInsights 
            mostProductiveDay={mostProductiveDay}
            avgTaskDuration={avgTaskDuration}
            weeklyStats={weeklyStats}
          />
        </TabsContent>

        {/* Time Analysis Tab */}
        <TabsContent value="time" className="space-y-4 sm:space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <TimeComparison userId={userId} />
            <TimeInsights userId={userId} />
          </div>
          <TimeBlocking userId={userId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <TimeChart data={dailyTime} userId={userId} />
            <ProjectDistribution data={projectDistribution} userId={userId} />
          </div>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-4 sm:space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <HabitTracker userId={userId} />
            <HeatmapCalendar userId={userId} />
          </div>
          <ProductivityInsights 
            mostProductiveDay={mostProductiveDay}
            avgTaskDuration={avgTaskDuration}
            weeklyStats={weeklyStats}
          />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4 sm:space-y-6 mt-4">
          <GoalSetting userId={userId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <ProductivityScore userId={userId} />
            <HabitTracker userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

