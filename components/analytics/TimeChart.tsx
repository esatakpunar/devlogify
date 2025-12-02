'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TimeChartProps {
  data: Array<{
    day: string
    minutes: number
  }>
}

export function TimeChart({ data }: TimeChartProps) {
  const t = useTranslation()
  const chartData = data.map(d => ({
    ...d,
    hours: Number((d.minutes / 60).toFixed(1))
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('analytics.dailyTimeThisWeek')}</h3>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#666" />
          <YAxis stroke="#666" label={{ value: t('analytics.hours'), angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: any) => [`${value}h`, t('analytics.time')]}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ddd',
              borderRadius: '8px' 
            }}
          />
          <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}