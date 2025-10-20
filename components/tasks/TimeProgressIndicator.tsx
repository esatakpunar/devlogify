'use client'

import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TimeProgressIndicatorProps {
  estimatedDuration: number | null
  actualDuration: number
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function TimeProgressIndicator({
  estimatedDuration,
  actualDuration,
  size = 'sm',
  showIcon = true,
  className
}: TimeProgressIndicatorProps) {
  // If no estimated duration, show actual time only
  if (!estimatedDuration) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {showIcon && <Clock className="w-3 h-3 text-gray-500" />}
        <span className="text-xs text-gray-600">
          {actualDuration}m
        </span>
      </div>
    )
  }

  // Calculate time status
  const ratio = actualDuration / estimatedDuration
  const timeDifference = actualDuration - estimatedDuration
  
  // Determine status and styling
  const getTimeStatus = () => {
    if (ratio <= 0.8) return { status: 'ahead', color: 'bg-green-100 text-green-700 border-green-200', icon: TrendingDown }
    if (ratio <= 1.2) return { status: 'on track', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Minus }
    return { status: 'overdue', color: 'bg-red-100 text-red-700 border-red-200', icon: TrendingUp }
  }

  const { status, color, icon: Icon } = getTimeStatus()

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {showIcon && <Clock className="w-3 h-3 text-gray-500" />}
      <Badge 
        variant="outline" 
        className={cn(
          'font-medium border',
          color,
          sizeClasses[size]
        )}
        title={`${actualDuration}m / ${estimatedDuration}m estimated (${timeDifference > 0 ? '+' : ''}${timeDifference}m)`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    </div>
  )
}
