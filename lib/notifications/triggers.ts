/**
 * Create a notification via API route (bypasses RLS issues when creating
 * notifications for other users) and trigger email sending in the background.
 */
async function createNotificationWithEmail(
  userId: string,
  companyId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  // Create notification via API route (server-side, no RLS issues)
  const res = await fetch('/api/notifications/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, companyId, type, title, message, metadata }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[createNotificationWithEmail] API error:', data.error)
    throw new Error(data.error || 'Failed to create notification')
  }

  const notification = data.notification

  // TODO: Email sending disabled - enable when domain is configured
  // fetch('/api/notifications/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     userId,
  //     subject: title,
  //     message,
  //     type,
  //     notificationId: notification?.id,
  //   }),
  // }).catch(err => console.error('Failed to trigger email:', err))

  return notification
}

/**
 * Send notification when a task's status changes.
 * Notifies assignee and responsible (if different from actor).
 */
export async function notifyTaskStatusChanged(params: {
  taskId: string
  taskTitle: string
  projectId: string
  companyId: string
  actorId: string
  assigneeId: string | null
  responsibleId: string | null
  oldStatus: string
  newStatus: string
}) {
  const { taskId, taskTitle, companyId, actorId, assigneeId, responsibleId, oldStatus, newStatus } = params
  const metadata = { task_id: taskId, project_id: params.projectId, old_status: oldStatus, new_status: newStatus }

  const statusLabel = newStatus === 'todo' ? 'To Do' : newStatus === 'in_progress' ? 'In Progress' : 'Done'

  const promises: Promise<any>[] = []

  // Notify assignee (if not the actor)
  if (assigneeId && assigneeId !== actorId) {
    promises.push(
      createNotificationWithEmail(
        assigneeId,
        companyId,
        'task_status_changed',
        'Task status changed',
        `"${taskTitle}" has been moved to ${statusLabel}`,
        metadata
      ).catch(err => console.error('Failed to notify assignee about status change:', err))
    )
  }

  // Notify responsible (if not the actor and not the assignee)
  if (responsibleId && responsibleId !== actorId && responsibleId !== assigneeId) {
    promises.push(
      createNotificationWithEmail(
        responsibleId,
        companyId,
        'task_status_changed',
        'Task status changed',
        `"${taskTitle}" has been moved to ${statusLabel}`,
        metadata
      ).catch(err => console.error('Failed to notify responsible about status change:', err))
    )
  }

  await Promise.allSettled(promises)
}

/**
 * Send notification when a task is assigned to someone.
 */
export async function notifyTaskAssigned(params: {
  taskId: string
  taskTitle: string
  projectId: string
  companyId: string
  actorId: string
  assigneeId: string
}) {
  const { taskId, taskTitle, companyId, actorId, assigneeId, projectId } = params

  if (assigneeId === actorId) return

  try {
    await createNotificationWithEmail(
      assigneeId,
      companyId,
      'task_assigned',
      'Task assigned to you',
      `You have been assigned to "${taskTitle}"`,
      { task_id: taskId, project_id: projectId }
    )
  } catch (err) {
    console.error('Failed to notify about task assignment:', err)
  }
}

/**
 * Send notification when a task is submitted for review.
 */
export async function notifyReviewRequested(params: {
  taskId: string
  taskTitle: string
  projectId: string
  companyId: string
  actorId: string
  responsibleId: string
}) {
  const { taskId, taskTitle, companyId, actorId, responsibleId, projectId } = params

  if (responsibleId === actorId) return

  try {
    await createNotificationWithEmail(
      responsibleId,
      companyId,
      'task_review_requested',
      'Review requested',
      `"${taskTitle}" is ready for your review`,
      { task_id: taskId, project_id: projectId }
    )
  } catch (err) {
    console.error('Failed to notify about review request:', err)
  }
}
