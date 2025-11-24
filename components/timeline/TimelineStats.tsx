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
    <div className="grid gap-4 md:grid-cols-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('timeline.today')}</p>
            <p className="text-2xl font-bold mt-2">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('timeline.completed')}</p>
            <p className="text-2xl font-bold mt-2">{completedTasks}</p>
            <p className="text-xs text-gray-500 mt-1">{t('timeline.tasksToday')}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('timeline.timeLogged')}</p>
            <p className="text-2xl font-bold mt-2">
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('timeline.today')}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('timeline.productivity')}</p>
            <p className="text-2xl font-bold mt-2">
              {completedTasks > 0 ? '🔥' : '😴'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {completedTasks > 0 ? t('timeline.onFire') : t('timeline.startWorking')}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  )
}