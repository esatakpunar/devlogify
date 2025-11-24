import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTaskSuggestions } from '@/lib/ai/taskSuggestions'
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

    // Get all user's active projects
    const projects = await getProjects(user.id, 'active', supabase)
    
    if (!projects || projects.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get all tasks from active projects
    const allTasks: any[] = []
    for (const project of projects) {
      const tasks = await getTasks(project.id, supabase)
      if (tasks) {
        allTasks.push(...tasks)
      }
    }

    // Generate suggestions
    const suggestions = await generateTaskSuggestions(allTasks)

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error generating task suggestions:', error)
    
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
      { error: error.message || 'Failed to generate task suggestions' },
      { status: 500 }
    )
  }
}

