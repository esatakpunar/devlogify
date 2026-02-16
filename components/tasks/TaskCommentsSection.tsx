'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'
import type { CompanyMemberWithProfile } from '@/types/supabase'
import {
  createTaskComment,
  deleteTaskComment,
  extractMentionsFromContent,
  getTaskComments,
  updateTaskComment,
  type TaskCommentWithAuthor,
} from '@/lib/supabase/queries/task-comments'
import { logActivity } from '@/lib/supabase/queries/activities'
import { notifyTaskCommentMentions } from '@/lib/notifications/triggers'

interface TaskCommentsSectionProps {
  taskId: string
  taskTitle: string
  projectId: string
  companyId: string
  userId: string
  members: CompanyMemberWithProfile[]
  readOnly?: boolean
}

interface MentionContext {
  start: number
  end: number
  query: string
}

const COMMENT_LIMIT = 2000

function getInitials(name: string | null, email: string): string {
  if (!name) return email.slice(0, 1).toUpperCase()
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function parseMentionContext(text: string, cursor: number): MentionContext | null {
  const textUntilCursor = text.slice(0, cursor)
  const atIndex = textUntilCursor.lastIndexOf('@')
  if (atIndex < 0) return null
  if (atIndex > 0 && !/\s/.test(textUntilCursor[atIndex - 1])) return null

  const query = textUntilCursor.slice(atIndex + 1)
  if (query.includes('\n')) return null
  if (query.length > 80) return null

  return {
    start: atIndex,
    end: cursor,
    query,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderTextWithMentionBadges(content: string, mentionNames: string[]) {
  if (mentionNames.length === 0) {
    return <>{content}</>
  }

  const escapedNames = mentionNames.map((name) => escapeRegExp(name)).sort((a, b) => b.length - a.length)
  const mentionRegex = new RegExp(
    `(^|\\s)@(${escapedNames.join('|')})(?=$|\\s|[.,!?;:()\\[\\]{}"'\\-])`,
    'gi'
  )

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let keyIndex = 0

  for (const match of content.matchAll(mentionRegex)) {
    const matchIndex = match.index ?? 0
    const leading = match[1] || ''
    const mentionValue = `@${match[2]}`
    const mentionStart = matchIndex + leading.length
    const mentionEnd = mentionStart + mentionValue.length

    if (matchIndex + leading.length > lastIndex) {
      nodes.push(
        <span key={`text-${keyIndex++}`}>
          {content.slice(lastIndex, mentionStart)}
        </span>
      )
    }

    nodes.push(
      <span
        key={`mention-${keyIndex++}`}
        className="mx-0.5 inline-flex rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
      >
        {mentionValue}
      </span>
    )

    lastIndex = mentionEnd
  }

  if (lastIndex < content.length) {
    nodes.push(<span key={`tail-${keyIndex++}`}>{content.slice(lastIndex)}</span>)
  }

  return nodes
}

function renderCommentContent(content: string, mentionNames: string[]) {
  const parts = content.split(/(https?:\/\/[^\s]+)/g)

  return parts.map((part, index) => {
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={`link-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-500"
        >
          {part}
        </a>
      )
    }

    return <span key={`text-${index}`}>{renderTextWithMentionBadges(part, mentionNames)}</span>
  })
}

export function TaskCommentsSection({
  taskId,
  taskTitle,
  projectId,
  companyId,
  userId,
  members,
  readOnly = false,
}: TaskCommentsSectionProps) {
  const t = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [comments, setComments] = useState<TaskCommentWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [mentionContext, setMentionContext] = useState<MentionContext | null>(null)
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0)

  const mentionableMembers = useMemo(
    () =>
      members.filter((member) => !!member.profile.full_name?.trim()),
    [members]
  )

  const mentionSuggestions = useMemo(() => {
    if (!mentionContext) return []
    const query = mentionContext.query.trim().toLowerCase()

    return mentionableMembers
      .filter((member) => {
        const fullName = member.profile.full_name?.trim().toLowerCase()
        if (!fullName) return false
        if (!query) return true
        return fullName.includes(query)
      })
      .slice(0, 8)
  }, [mentionContext, mentionableMembers])

  useEffect(() => {
    setHighlightedMentionIndex(0)
  }, [mentionSuggestions.length, mentionContext?.query])

  useEffect(() => {
    setIsLoading(true)
    getTaskComments(taskId)
      .then((data) => setComments(data))
      .catch((error) => {
        console.error('Failed to load task comments:', error)
        toast.error(t('tasks.failedToLoadComments') || 'Failed to load comments')
      })
      .finally(() => setIsLoading(false))
  }, [taskId, t])

  const upsertMentionInDraft = (memberName: string) => {
    if (!mentionContext) return
    const replacement = `@${memberName} `
    const nextValue =
      draft.slice(0, mentionContext.start) + replacement + draft.slice(mentionContext.end)

    setDraft(nextValue)
    setMentionContext(null)

    requestAnimationFrame(() => {
      const nextCursor = mentionContext.start + replacement.length
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const handleDraftChange = (value: string) => {
    if (value.length > COMMENT_LIMIT) return

    setDraft(value)
    const cursor = textareaRef.current?.selectionStart ?? value.length
    setMentionContext(parseMentionContext(value, cursor))
  }

  const handleCreateComment = async () => {
    const normalized = draft.trim()
    if (!normalized) return
    if (normalized.length > COMMENT_LIMIT) {
      toast.error(t('tasks.commentTooLong') || `Comment must be at most ${COMMENT_LIMIT} characters`)
      return
    }

    setIsSubmitting(true)
    try {
      const mentionedUserIds = extractMentionsFromContent(normalized, mentionableMembers)
      const created = await createTaskComment({
        task_id: taskId,
        company_id: companyId,
        user_id: userId,
        content: normalized,
        mentioned_user_ids: mentionedUserIds,
      })

      setComments((prev) => [...prev, created])
      setDraft('')
      setMentionContext(null)

      await logActivity(
        userId,
        projectId,
        taskId,
        'comment_added',
        {
          task_title: taskTitle,
          comment_id: created.id,
        },
        companyId
      )

      await notifyTaskCommentMentions({
        taskId,
        taskTitle,
        projectId,
        companyId,
        actorId: userId,
        mentionedUserIds,
        commentPreview: normalized,
      })

      toast.success(t('tasks.commentAdded') || 'Comment added')
    } catch (error) {
      console.error('Failed to create task comment:', error)
      toast.error(t('tasks.failedToAddComment') || 'Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (comment: TaskCommentWithAuthor) => {
    setEditingCommentId(comment.id)
    setEditingDraft(comment.content)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditingDraft('')
  }

  const saveEdit = async (comment: TaskCommentWithAuthor) => {
    const normalized = editingDraft.trim()
    if (!normalized) return
    if (normalized.length > COMMENT_LIMIT) {
      toast.error(t('tasks.commentTooLong') || `Comment must be at most ${COMMENT_LIMIT} characters`)
      return
    }

    try {
      const mentionedUserIds = extractMentionsFromContent(normalized, mentionableMembers)
      const updated = await updateTaskComment(comment.id, userId, {
        content: normalized,
        mentioned_user_ids: mentionedUserIds,
      })

      setComments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      cancelEdit()

      await logActivity(
        userId,
        projectId,
        taskId,
        'comment_edited',
        {
          task_title: taskTitle,
          comment_id: comment.id,
        },
        companyId
      )

      await notifyTaskCommentMentions({
        taskId,
        taskTitle,
        projectId,
        companyId,
        actorId: userId,
        mentionedUserIds,
        commentPreview: normalized,
      })

      toast.success(t('tasks.commentUpdated') || 'Comment updated')
    } catch (error) {
      console.error('Failed to update task comment:', error)
      toast.error(t('tasks.failedToUpdateComment') || 'Failed to update comment')
    }
  }

  const handleDelete = async (comment: TaskCommentWithAuthor) => {
    try {
      await deleteTaskComment(comment.id, userId)
      setComments((prev) => prev.filter((item) => item.id !== comment.id))
      if (editingCommentId === comment.id) cancelEdit()

      await logActivity(
        userId,
        projectId,
        taskId,
        'comment_deleted',
        {
          task_title: taskTitle,
          comment_id: comment.id,
        },
        companyId
      )

      toast.success(t('tasks.commentDeleted') || 'Comment deleted')
    } catch (error) {
      console.error('Failed to delete task comment:', error)
      toast.error(t('tasks.failedToDeleteComment') || 'Failed to delete comment')
    }
  }

  const canSubmit = !isSubmitting && !readOnly && draft.trim().length > 0

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-2.5 sm:px-4">
        <h3 className="text-sm font-semibold">{t('tasks.comments') || 'Comments'}</h3>
        <span className="text-xs text-muted-foreground">{comments.length}</span>
      </div>

      <div className="max-h-[420px] overflow-y-auto px-3 py-3 sm:px-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('tasks.noCommentsYet') || 'No comments yet'}</p>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.user_id === userId
            const isEditing = editingCommentId === comment.id
            const authorName = comment.author?.full_name || comment.author?.email || t('company.unknownUser')

            return (
              <div key={comment.id} className="rounded-md border p-3">
                <div className="flex items-start gap-2">
                  <Avatar className="mt-0.5 h-7 w-7">
                    <AvatarImage src={comment.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(comment.author?.full_name || null, comment.author?.email || 'u')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{authorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          {comment.updated_at !== comment.created_at ? ` · ${t('common.edited') || 'edited'}` : ''}
                        </p>
                      </div>

                      {isOwner && !readOnly && (
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => saveEdit(comment)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => startEdit(comment)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-600 hover:text-red-500"
                                onClick={() => handleDelete(comment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={editingDraft}
                        onChange={(event) => setEditingDraft(event.target.value.slice(0, COMMENT_LIMIT))}
                        className="min-h-20 text-sm"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {renderCommentContent(
                          comment.content,
                          comment.mentioned_user_ids
                            .map((mentionedUserId) =>
                              members.find((member) => member.user_id === mentionedUserId)?.profile.full_name?.trim() || null
                            )
                            .filter((name): name is string => !!name)
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {!readOnly && (
        <div className="sticky bottom-0 z-10 border-t bg-background px-3 py-3 sm:px-4">
          <div className="relative space-y-2">
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (mentionSuggestions.length > 0) {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setHighlightedMentionIndex((prev) => (prev + 1) % mentionSuggestions.length)
                    return
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setHighlightedMentionIndex((prev) =>
                      prev === 0 ? mentionSuggestions.length - 1 : prev - 1
                    )
                    return
                  }
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    const selected = mentionSuggestions[highlightedMentionIndex]
                    if (selected.profile.full_name) {
                      upsertMentionInDraft(selected.profile.full_name)
                    }
                    return
                  }
                }
              }}
              placeholder={t('tasks.commentPlaceholder') || 'Write a comment... Use @name to mention teammates.'}
              className="min-h-20 text-sm"
              disabled={isSubmitting}
            />

            {mentionSuggestions.length > 0 && (
              <div className="absolute left-0 bottom-[calc(100%+4px)] z-20 w-full max-h-52 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                {mentionSuggestions.map((member, index) => (
                  <button
                    key={member.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                      index === highlightedMentionIndex && 'bg-accent'
                    )}
                    onClick={() => {
                      if (member.profile.full_name) {
                        upsertMentionInDraft(member.profile.full_name)
                      }
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.profile.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(member.profile.full_name, member.profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{member.profile.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.profile.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {draft.length}/{COMMENT_LIMIT}
            </span>
            <Button type="button" size="sm" onClick={handleCreateComment} disabled={!canSubmit}>
              {isSubmitting ? (t('common.loading') || 'Loading...') : (t('tasks.postComment') || 'Post comment')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
