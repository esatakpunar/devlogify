'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'

interface ProjectDistributionProps {
  data: Array<{
    title: string
    color: string
    minutes: number
  }>
  userId?: string
}

export function ProjectDistribution({ data, userId }: ProjectDistributionProps) {
  const t = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { isPremium } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  
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
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('analytics.timeByProject')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!isPremium) {
              setUpgradeDialogOpen(true)
              return
            }
            const csv = [
              ['Project', 'Hours'].join(','),
              ...chartData.map(d => [d.name, d.value].join(','))
            ].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'project-distribution.csv'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="h-8"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={activeIndex !== null ? 90 : 80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ transition: 'all 0.3s ease' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ 
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.5,
                  transition: 'opacity 0.3s ease',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => `${value}h`}
            contentStyle={{ 
              backgroundColor: 'var(--background)', 
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Share & Export"
      />
    </div>
  )
}