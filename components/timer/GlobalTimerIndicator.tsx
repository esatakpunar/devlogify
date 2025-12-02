'use client'

import { useState } from 'react'
import { useTimer } from '@/lib/hooks/useTimer'
import { Clock, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface GlobalTimerIndicatorProps {
  userId: string
}

export function GlobalTimerIndicator({ userId }: GlobalTimerIndicatorProps) {
  const [loading, setLoading] = useState(false)
  const { isRunning, elapsed, taskTitle, stopTimer, formatTime } = useTimer()
  const router = useRouter()

  const handleStop = async () => {
    setLoading(true)
    try {
      const durationMinutes = Math.floor(elapsed / 60)
      await stopTimer(userId)
      
      toast.success('Timer stopped', {
        description: `Logged ${durationMinutes} minutes`,
      })
      
      router.refresh()
    } catch (error) {
      console.error('Failed to stop timer:', error)
      toast.error('Failed to stop timer')
    } finally {
      setLoading(false)
    }
  }

  if (!isRunning) return null

  return (
    <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md sm:rounded-lg">
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse flex-shrink-0" />
        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-mono font-medium text-blue-900 dark:text-blue-100 whitespace-nowrap">
          {formatTime(elapsed)}
        </span>
      </div>
      {taskTitle && (
        <span className="hidden sm:inline text-xs text-blue-700 dark:text-blue-300 max-w-[120px] truncate">
          {taskTitle}
        </span>
      )}
      <Button 
        size="sm" 
        variant="ghost"
        onClick={handleStop}
        disabled={loading}
        className="h-5 w-5 sm:h-6 sm:w-6 sm:px-2 p-0 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800 flex-shrink-0"
      >
        <Square className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      </Button>
    </div>
  )
}