'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface ProjectDistributionProps {
  data: Array<{
    title: string
    color: string
    minutes: number
  }>
}

export function ProjectDistribution({ data }: ProjectDistributionProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-[368px]">
        <p className="text-gray-500">No project data yet</p>
      </div>
    )
  }

  const chartData = data.map(d => ({
    name: d.title,
    value: Number((d.minutes / 60).toFixed(1)),
    color: d.color
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Time by Project</h3>
      <ResponsiveContainer width="100%" height={300}>
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