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
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
        <Clock className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-mono font-medium text-blue-900">
          {formatTime(elapsed)}
        </span>
      </div>
      {taskTitle && (
        <span className="text-xs text-blue-700 max-w-[150px] truncate">
          {taskTitle}
        </span>
      )}
      <Button 
        size="sm" 
        variant="ghost"
        onClick={handleStop}
        disabled={loading}
        className="h-6 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
      >
        <Square className="w-3 h-3" />
      </Button>
    </div>
  )
}