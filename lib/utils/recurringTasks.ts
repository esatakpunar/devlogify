/**
 * Utilities for calculating next run times for recurring tasks
 */

export interface ScheduleConfig {
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31
  time?: string // HH:MM format
}

/**
 * Calculate next run time for a recurring task
 */
export function calculateNextRunAt(
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom',
  scheduleConfig: ScheduleConfig,
  cronExpression?: string | null,
  lastCreatedAt?: string | null
): Date {
  const now = new Date()
  const nextRun = new Date(now)

  switch (scheduleType) {
    case 'daily': {
      // Run at the same time every day
      const time = scheduleConfig.time || '09:00'
      const [hours, minutes] = time.split(':').map(Number)
      nextRun.setHours(hours, minutes, 0, 0)
      
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
    }

    case 'weekly': {
      // Run on specific days of the week
      const daysOfWeek = scheduleConfig.daysOfWeek || [1] // Default: Monday
      const time = scheduleConfig.time || '09:00'
      const [hours, minutes] = time.split(':').map(Number)
      
      // Find next matching day
      const currentDay = now.getDay()
      let daysUntilNext = 0
      
      for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7
        if (daysOfWeek.includes(checkDay)) {
          daysUntilNext = i
          break
        }
      }
      
      // If no day found this week, use first day of next week
      if (daysUntilNext === 0 && !daysOfWeek.includes(currentDay)) {
        daysUntilNext = 7 - currentDay + Math.min(...daysOfWeek)
      }
      
      nextRun.setDate(now.getDate() + daysUntilNext)
      nextRun.setHours(hours, minutes, 0, 0)
      
      // If time has passed today and it's the same day, schedule for next week
      if (daysUntilNext === 0 && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7)
      }
      break
    }

    case 'monthly': {
      // Run on specific day of month
      const dayOfMonth = scheduleConfig.dayOfMonth || 1
      const time = scheduleConfig.time || '09:00'
      const [hours, minutes] = time.split(':').map(Number)
      
      nextRun.setDate(dayOfMonth)
      nextRun.setHours(hours, minutes, 0, 0)
      
      // If day has passed this month, schedule for next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
    }

    case 'custom': {
      // For cron expressions, we'd need a cron parser library
      // For now, default to daily
      if (cronExpression) {
        // Basic cron parsing would go here
        // For simplicity, default to daily
        nextRun.setDate(nextRun.getDate() + 1)
        nextRun.setHours(9, 0, 0, 0)
      } else {
        nextRun.setDate(nextRun.getDate() + 1)
        nextRun.setHours(9, 0, 0, 0)
      }
      break
    }
  }

  return nextRun
}

/**
 * Check if a recurring task is due to be created
 */
export function isRecurringTaskDue(nextRunAt: string | null, isActive: boolean): boolean {
  if (!isActive || !nextRunAt) return false
  
  const nextRun = new Date(nextRunAt)
  const now = new Date()
  
  return nextRun <= now
}

