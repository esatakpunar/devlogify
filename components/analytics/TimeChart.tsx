'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'

interface TimeChartProps {
  data: Array<{
    day: string
    minutes: number
  }>
  userId?: string
}

export function TimeChart({ data, userId }: TimeChartProps) {
  const t = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { isPremium } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  
  const chartData = data.map(d => ({
    ...d,
    hours: Number((d.minutes / 60).toFixed(1))
  }))

  const maxHours = Math.max(...chartData.map(d => d.hours), 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('analytics.dailyTimeThisWeek')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!isPremium) {
              setUpgradeDialogOpen(true)
              return
            }
            // Export functionality can be added here
            const csv = [
              ['Day', 'Hours'].join(','),
              ...chartData.map(d => [d.day, d.hours].join(','))
            ].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'time-chart.csv'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="h-8"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <BarChart 
          data={chartData}
          onMouseMove={(state) => {
            if (state?.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
              setActiveIndex(state.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="day" 
            stroke="#666" 
            className="dark:stroke-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            stroke="#666" 
            className="dark:stroke-gray-400"
            label={{ value: t('analytics.hours'), angle: -90, position: 'insideLeft' }}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            formatter={(value: any) => [`${value}h`, t('analytics.time')]}
            contentStyle={{ 
              backgroundColor: 'var(--background)', 
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Bar 
            dataKey="hours" 
            radius={[8, 8, 0, 0]}
            onMouseEnter={() => {}}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={activeIndex === index ? '#2563eb' : entry.hours === maxHours ? '#3b82f6' : '#60a5fa'}
                style={{ transition: 'fill 0.2s ease' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Share & Export"
      />
    </div>
  )
}