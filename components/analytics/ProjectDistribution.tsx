'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProjectDistributionProps {
  data: Array<{
    title: string
    color: string
    minutes: number
  }>
}

export function ProjectDistribution({ data }: ProjectDistributionProps) {
  const t = useTranslation()
  
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center justify-center h-[250px] sm:h-[368px]">
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{t('analytics.noProjectDataYet')}</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    name: d.title,
    value: Number((d.minutes / 60).toFixed(1)),
    color: d.color
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('analytics.timeByProject')}</h3>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => `${value}h`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}