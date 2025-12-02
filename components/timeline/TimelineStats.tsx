'use client'

import { CheckCircle2, Clock, TrendingUp, Calendar } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TimelineStatsProps {
  completedTasks: number
  totalMinutes: number
}

export function TimelineStats({ completedTasks, totalMinutes }: TimelineStatsProps) {
  const t = useTranslation()
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('timeline.today')}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 dark:text-white truncate">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('timeline.completed')}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 dark:text-white">{completedTasks}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('timeline.tasksToday')}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('timeline.timeLogged')}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 dark:text-white">
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('timeline.today')}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('timeline.productivity')}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 dark:text-white">
              {completedTasks > 0 ? '🔥' : '😴'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {completedTasks > 0 ? t('timeline.onFire') : t('timeline.startWorking')}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </div>
  )
}