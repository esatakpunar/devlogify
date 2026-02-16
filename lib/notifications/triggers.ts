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
  const res = await fetch('/api/notifications/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, companyId, type, title, message, metadata }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[Notification] Failed to create:', data.error)
    throw new Error(data.error || 'Failed to create notification')
  }

  // TODO: Email sending disabled - enable when domain is configured
  // fetch('/api/notifications/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     userId,
  //     subject: title,
  //     message,
  //     type,
  //     notificationId: data.notification?.id,
  //   }),
  // }).catch(err => console.error('[Notification] Email send failed:', err))

  return data.notification
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

  // Don't notify if user assigns task to themselves
  if (assigneeId === actorId) return

  await createNotificationWithEmail(
    assigneeId,
    companyId,
    'task_assigned',
    'Task assigned to you',
    `You have been assigned to "${taskTitle}"`,
    { task_id: taskId, project_id: projectId }
  )
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

  // Let errors propagate to calling code for proper error handling
  await createNotificationWithEmail(
    responsibleId,
    companyId,
    'task_review_requested',
    'Review requested',
    `"${taskTitle}" is ready for your review`,
    { task_id: taskId, project_id: projectId }
  )
}

/**
 * Send notifications when users are mentioned in a task comment.
 */
export async function notifyTaskCommentMentions(params: {
  taskId: string
  taskTitle: string
  projectId: string
  companyId: string
  actorId: string
  mentionedUserIds: string[]
  commentPreview: string
}) {
  const { taskId, taskTitle, projectId, companyId, actorId, mentionedUserIds, commentPreview } = params

  if (!mentionedUserIds || mentionedUserIds.length === 0) return

  const uniqueTargets = Array.from(new Set(mentionedUserIds)).filter((id) => id !== actorId)
  if (uniqueTargets.length === 0) return

  const metadata = {
    task_id: taskId,
    project_id: projectId,
  }

  const snippet = commentPreview.trim().slice(0, 140)
  const message = snippet
    ? `You were mentioned in "${taskTitle}": ${snippet}`
    : `You were mentioned in "${taskTitle}"`

  const jobs = uniqueTargets.map((targetUserId) =>
    createNotificationWithEmail(
      targetUserId,
      companyId,
      'task_mentioned',
      'You were mentioned in a comment',
      message,
      metadata
    ).catch((error) => {
      console.error('[Notification] Failed to send mention notification:', error)
    })
  )

  await Promise.allSettled(jobs)
}
