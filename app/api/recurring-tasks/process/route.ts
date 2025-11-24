import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDueRecurringTasks } from '@/lib/supabase/queries/recurringTasks'
import { createTask } from '@/lib/supabase/queries/tasks'
import { calculateNextRunAt } from '@/lib/utils/recurringTasks'
import type { Database } from '@/types/supabase'

/**
 * Process recurring tasks and create new tasks
 * This should be called by a cron job (Vercel Cron or Supabase Edge Function)
 * 
 * Vercel Cron will call this endpoint via GET request
 * Manual calls can use POST with Authorization header
 */
export async function GET(request: NextRequest) {
  return processRecurringTasks(request)
}

export async function POST(request: NextRequest) {
  return processRecurringTasks(request)
}

async function processRecurringTasks(request: NextRequest) {
  try {
    // This endpoint should be protected by a secret token in production
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret') // Vercel Cron sends this
    const expectedToken = process.env.CRON_SECRET

    if (expectedToken) {
      // Check both authorization header (for manual calls) and x-cron-secret (for Vercel Cron)
      const isValidAuth = authHeader === `Bearer ${expectedToken}`
      const isValidCron = cronSecret === expectedToken

      if (!isValidAuth && !isValidCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Create a service role client to bypass RLS for cron jobs
    // Use service role key if available, otherwise use anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
    }

    // Use service role key if available (bypasses RLS), otherwise use anon key
    const supabase = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey!
    )

    // Get all due recurring tasks (pass supabase client to bypass RLS)
    const dueTasks = await getDueRecurringTasks(supabase)

    const results = []

    for (const recurringTask of dueTasks) {
      try {
        // Create the task
        if (!recurringTask.project_id) {
          console.warn(`Skipping recurring task ${recurringTask.id}: no project_id`)
          continue
        }

        const newTask = await createTask({
          project_id: recurringTask.project_id,
          user_id: recurringTask.user_id,
          title: recurringTask.title,
          description: recurringTask.description,
          priority: recurringTask.priority,
          estimated_duration: recurringTask.estimated_duration,
          status: 'todo',
        }, supabase)

        // Update recurring task's last_created_at and next_run_at
        const scheduleConfig = recurringTask.schedule_config as any || {}
        const nextRunAt = calculateNextRunAt(
          recurringTask.schedule_type,
          scheduleConfig,
          recurringTask.cron_expression,
          recurringTask.last_created_at || undefined
        )

        const { error: updateError } = await supabase
          .from('recurring_tasks')
          .update({
            last_created_at: new Date().toISOString(),
            next_run_at: nextRunAt.toISOString(),
          })
          .eq('id', recurringTask.id)

        if (updateError) {
          throw updateError
        }

        results.push({
          recurringTaskId: recurringTask.id,
          taskId: newTask.id,
          success: true,
        })
      } catch (error: any) {
        console.error(`Error processing recurring task ${recurringTask.id}:`, error)
        results.push({
          recurringTaskId: recurringTask.id,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error: any) {
    console.error('Error processing recurring tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process recurring tasks' },
      { status: 500 }
    )
  }
}

