import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addTagsToTasks } from '@/lib/supabase/queries/tasks'

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

    const body = await request.json()
    const { taskIds, tags } = body

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: 'taskIds is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: 'tags is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify ownership of tasks
    const { data: tasks, error: verifyError } = await supabase
      .from('tasks')
      .select('id, user_id')
      .in('id', taskIds)

    if (verifyError) {
      return NextResponse.json(
        { error: 'Failed to verify tasks' },
        { status: 500 }
      )
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks found' },
        { status: 404 }
      )
    }

    // Check if all tasks belong to the user
    const unauthorizedTasks = tasks.filter(task => task.user_id !== user.id)
    if (unauthorizedTasks.length > 0) {
      return NextResponse.json(
        { error: 'Unauthorized: Some tasks do not belong to you' },
        { status: 403 }
      )
    }

    // Add tags
    try {
      const result = await addTagsToTasks(taskIds, tags, supabase)
      
      return NextResponse.json({ 
        success: true,
        message: `Tags added to ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
        updatedTasks: result
      })
    } catch (addTagsError: any) {
      console.error('Error in addTagsToTasks:', addTagsError)
      throw addTagsError
    }
  } catch (error: any) {
    console.error('Error adding tags to tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add tags to tasks' },
      { status: 500 }
    )
  }
}

