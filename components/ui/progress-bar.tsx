'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
  interactive?: boolean
  onValueChange?: (value: number) => void
}

export function ProgressBar({ 
  value, 
  showPercentage = false, 
  size = 'md',
  className,
  animated = true,
  interactive = false,
  onValueChange
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))
  
  // Determine color based on progress
  const getColorClass = (progress: number) => {
    if (progress <= 30) return 'bg-red-500'
    if (progress <= 70) return 'bg-amber-500'
    return 'bg-green-500'
  }
  
  // Size classes
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }
  
  const percentageSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onValueChange) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.round((clickX / rect.width) * 100)
    const clampedPercentage = Math.max(0, Math.min(100, percentage))
    
    onValueChange(clampedPercentage)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className={cn(
          'flex-1 bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size],
          interactive && 'cursor-pointer hover:bg-gray-300 transition-colors'
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${clampedValue}%`}
        onClick={handleClick}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getColorClass(clampedValue),
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ 
            width: `${clampedValue}%`,
            transition: animated ? 'width 0.5s ease-out' : 'none'
          }}
        />
      </div>
      {showPercentage && (
        <span 
          className={cn(
            'font-medium text-gray-600 min-w-[3ch] text-right',
            percentageSizeClasses[size]
          )}
        >
          {clampedValue}%
        </span>
      )}
    </div>
  )
}
