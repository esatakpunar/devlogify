import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStandupSummary } from '@/lib/ai/standupSummary'
import { getActivitiesByDateRange } from '@/lib/supabase/queries/activities'
import { getTasks } from '@/lib/supabase/queries/tasks'
import { getProjects } from '@/lib/supabase/queries/projects'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get yesterday's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    // Get yesterday's activities
    const yesterdayActivities = await getActivitiesByDateRange(
      user.id,
      yesterday.toISOString(),
      yesterdayEnd.toISOString()
    )

    // Get today's tasks from all active projects
    const projects = await getProjects(user.id, 'active', supabase)
    const todayTasks: any[] = []
    
    for (const project of projects) {
      const tasks = await getTasks(project.id, supabase)
      if (tasks) {
        // Filter for today's tasks (incomplete or in progress)
        const todayProjectTasks = tasks.filter(
          (task) => task.status !== 'completed'
        )
        todayTasks.push(...todayProjectTasks)
      }
    }

    // Generate standup summary
    const summary = await generateStandupSummary(
      yesterdayActivities || [],
      todayTasks
    )

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Error generating standup summary:', error)

    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please try again in a moment.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate standup summary' },
      { status: 500 }
    )
  }
}

