import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTagSuggestions } from '@/lib/ai/taskGrouping'
import { getTasks } from '@/lib/supabase/queries/tasks'
import { getProjects } from '@/lib/supabase/queries/projects'
import { checkIsPremium, getUserLocale } from '@/lib/utils/premium'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check premium status
    const isPremium = await checkIsPremium(user.id, supabase)
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to use AI features' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { projectId } = body

    let tasks: any[] = []

    if (projectId) {
      tasks = await getTasks(projectId, supabase) || []
    } else {
      const projects = await getProjects(user.id, 'active', supabase)
      for (const project of projects) {
        const projectTasks = await getTasks(project.id, supabase)
        if (projectTasks) {
          tasks.push(...projectTasks)
        }
      }
    }

    // Get user's language preference
    const locale = await getUserLocale(user.id, supabase)

    // Generate tag suggestions
    const suggestions = await generateTagSuggestions(tasks, locale)

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error generating tag suggestions:', error)

    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate tag suggestions' },
      { status: 500 }
    )
  }
}

