'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { updateTaskProgress } from '@/lib/supabase/queries/tasks'
import { logTaskProgressUpdate } from '@/lib/supabase/queries/activities'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProgressSliderProps {
  taskId: string
  projectId: string
  userId: string
  taskTitle: string
  currentProgress: number
  onProgressUpdate: (newProgress: number) => void
  className?: string
  compact?: boolean
  autoSave?: boolean
  showPreview?: boolean
}

export function ProgressSlider({
  taskId,
  projectId,
  userId,
  taskTitle,
  currentProgress,
  onProgressUpdate,
  className,
  compact = false,
  autoSave = true,
  showPreview = true
}: ProgressSliderProps) {
  const [progress, setProgress] = useState(currentProgress)
  const [isUpdating, setIsUpdating] = useState(false)
  const [localProgress, setLocalProgress] = useState(currentProgress)

  // Update local progress when currentProgress changes
  useEffect(() => {
    setProgress(currentProgress)
    setLocalProgress(currentProgress)
  }, [currentProgress])

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (newProgress: number) => {
      if (newProgress === currentProgress) return

      // If autoSave is disabled, just update local state
      if (!autoSave) {
        onProgressUpdate(newProgress)
        return
      }

      setIsUpdating(true)
      try {
        const updatedTask = await updateTaskProgress(taskId, newProgress)
        
        // Log activity
        await logTaskProgressUpdate(
          userId,
          projectId,
          taskId,
          currentProgress,
          newProgress,
          taskTitle
        )

        onProgressUpdate(newProgress)
        
        // Show milestone celebration
        if ([25, 50, 75, 100].includes(newProgress)) {
          toast.success(`Milestone reached! ${newProgress}% complete`, {
            description: `"${taskTitle}" is making great progress!`
          })
          
          // Add confetti effect for 100%
          if (newProgress === 100) {
            // Simple confetti effect using CSS animation
            const confettiElement = document.createElement('div')
            confettiElement.innerHTML = '🎉'
            confettiElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl z-50 animate-bounce'
            document.body.appendChild(confettiElement)
            
            setTimeout(() => {
              document.body.removeChild(confettiElement)
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Failed to update progress:', error)
        toast.error('Failed to update progress')
        // Revert on error
        setProgress(currentProgress)
        setLocalProgress(currentProgress)
      } finally {
        setIsUpdating(false)
      }
    }, 500),
    [taskId, projectId, userId, taskTitle, currentProgress, onProgressUpdate, autoSave]
  )

  const handleSliderChange = (value: number) => {
    setLocalProgress(value)
    debouncedUpdate(value)
  }

  const handlePresetClick = (preset: number) => {
    setLocalProgress(preset)
    debouncedUpdate(preset)
  }

  const presets = [0, 25, 50, 75, 100]

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {showPreview && <ProgressBar value={localProgress} showPercentage size="sm" />}
        <div className="flex items-center gap-1">
          <input
            type="range"
            min="0"
            max="100"
            value={localProgress}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            disabled={isUpdating}
          />
          <span className="text-xs text-gray-500 min-w-[3ch] text-right">
            {localProgress}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-webkit-slider-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
        }
        .slider::-moz-range-track {
          background: #e5e7eb;
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
      <div className={cn('space-y-3', className)}>
        {/* Progress Bar Preview - Only show if showPreview is true */}
        {showPreview && (
          <div className="space-y-2">
            <ProgressBar value={localProgress} showPercentage size="md" />
            {isUpdating && (
              <div className="text-xs text-gray-500 animate-pulse">
                Updating...
              </div>
            )}
          </div>
        )}

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{localProgress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localProgress}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          disabled={isUpdating}
        />
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button
            key={preset}
            variant={localProgress === preset ? "default" : "outline"}
            size="sm"
            className={cn(
              'flex-1 text-xs',
              localProgress === preset && 'bg-blue-500 hover:bg-blue-600'
            )}
            onClick={() => handlePresetClick(preset)}
            disabled={isUpdating}
          >
            {preset}%
          </Button>
        ))}
      </div>
    </div>
    </>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
