import { createClient } from '@/lib/supabase/client'

export type ActivityType = 
  | 'task_created'
  | 'task_completed'
  | 'task_status_changed'
  | 'time_logged'
  | 'project_created'
  | 'note_created'

export async function logActivity(
  userId: string,
  projectId: string | null,
  taskId: string | null,
  actionType: ActivityType,
  metadata?: any
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      project_id: projectId,
      task_id: taskId,
      action_type: actionType,
      metadata: metadata || {},
    })

  if (error) {
    console.error('Failed to log activity:', error)
  }
}