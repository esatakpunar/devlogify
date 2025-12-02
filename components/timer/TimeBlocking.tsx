'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, Plus, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { toast } from 'sonner'

interface TimeBlock {
  id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration: number | null
  note: string | null
  task?: {
    id: string
    title: string
    project_id: string
  } | null
}

interface TimeBlockingProps {
  userId: string
}

export function TimeBlocking({ userId }: TimeBlockingProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(false)
  const t = useTranslation()
  const supabase = createClient()

  // Get week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    loadTimeBlocks()
  }, [selectedDate, userId])

  const loadTimeBlocks = async () => {
    setLoading(true)
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')
      const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          task:tasks(id, title, project_id)
        `)
        .eq('user_id', userId)
        .gte('started_at', weekStartStr + 'T00:00:00')
        .lte('started_at', weekEndStr + 'T23:59:59')
        .order('started_at', { ascending: true })

      if (error) throw error

      setTimeBlocks(data || [])
    } catch (error) {
      console.error('Failed to load time blocks:', error)
      toast.error(t('timer.failedToLoadTimeBlocks') || 'Failed to load time blocks')
    } finally {
      setLoading(false)
    }
  }

  const getDayBlocks = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return timeBlocks.filter(block => {
      const blockDate = format(parseISO(block.started_at), 'yyyy-MM-dd')
      return blockDate === dateStr
    })
  }

  const getTotalMinutesForDay = (date: Date) => {
    const dayBlocks = getDayBlocks(date)
    return dayBlocks.reduce((total, block) => total + (block.duration || 0), 0)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 dark:text-white">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('timer.timeBlocking') || 'Time Blocking'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('timer.timeBlockingDescription') || 'Plan and track your time blocks for the week'}
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              {t('common.today') || 'Today'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              →
            </Button>
          </div>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day, index) => {
            const dayBlocks = getDayBlocks(day)
            const totalMinutes = getTotalMinutesForDay(day)
            const isTodayDate = isToday(day)

            return (
              <div
                key={index}
                className={`p-2 sm:p-3 rounded-lg border ${
                  isTodayDate
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="text-xs font-medium mb-1 sm:mb-2 dark:text-gray-300">
                  {format(day, 'EEE')}
                </div>
                <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 dark:text-gray-200">
                  {format(day, 'd')}
                </div>
                {totalMinutes > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="truncate">{formatTime(totalMinutes)}</span>
                  </div>
                )}
                {dayBlocks.length > 0 && (
                  <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                    {dayBlocks.slice(0, 1).map((block) => (
                      <Badge
                        key={block.id}
                        variant="secondary"
                        className="text-xs w-full justify-start truncate"
                      >
                        {formatTime(block.duration || 0)}
                      </Badge>
                    ))}
                    {dayBlocks.length > 1 && (
                      <Badge variant="outline" className="text-xs w-full justify-center">
                        +{dayBlocks.length - 1}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected Day Details */}
        {getDayBlocks(selectedDate).length > 0 && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="text-xs sm:text-sm font-semibold mb-2 dark:text-gray-200">
              {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </h4>
            <div className="space-y-2">
              {getDayBlocks(selectedDate).map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium dark:text-gray-200 truncate">
                      {block.task?.title || block.note || t('timer.timeBlock') || 'Time Block'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(block.started_at), 'HH:mm')} -{' '}
                      {block.ended_at
                        ? format(parseISO(block.ended_at), 'HH:mm')
                        : t('timer.ongoing') || 'Ongoing'}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-xs">
                    {formatTime(block.duration || 0)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {t('common.loading') || 'Loading...'}
          </div>
        )}
      </div>
    </Card>
  )
}

