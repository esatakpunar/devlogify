'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TimeChartProps {
  data: Array<{
    day: string
    minutes: number
  }>
}

export function TimeChart({ data }: TimeChartProps) {
  const chartData = data.map(d => ({
    ...d,
    hours: Number((d.minutes / 60).toFixed(1))
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Daily Time This Week</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#666" />
          <YAxis stroke="#666" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value: any) => [`${value}h`, 'Time']}
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