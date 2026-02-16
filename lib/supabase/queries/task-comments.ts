import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { CompanyMemberWithProfile, Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type TaskCommentInsert = Database['public']['Tables']['task_comments']['Insert']
export type TaskCommentUpdate = Database['public']['Tables']['task_comments']['Update']

export type TaskCommentWithAuthor = TaskComment & {
  author: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
}

const MAX_COMMENT_LENGTH = 2000

function validateCommentContent(content: string) {
  const normalized = content.trim()
  if (!normalized) {
    throw new Error('Comment content is required')
  }
  if (normalized.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment must be at most ${MAX_COMMENT_LENGTH} characters`)
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractMentionsFromContent(
  content: string,
  companyMembers: Pick<CompanyMemberWithProfile, 'user_id' | 'profile'>[]
): string[] {
  if (!content.trim() || companyMembers.length === 0) return []

  const mentioned = new Set<string>()

  for (const member of companyMembers) {
    const fullName = member.profile.full_name?.trim()
    if (!fullName) continue

    const pattern = new RegExp(
      `(^|\\s)@${escapeRegExp(fullName)}(?=$|\\s|[.,!?;:()\\[\\]{}"'\\-])`,
      'gi'
    )

    if (pattern.test(content)) {
      mentioned.add(member.user_id)
    }
  }

  return Array.from(mentioned)
}

export async function getTaskComments(
  taskId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<TaskCommentWithAuthor[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      author:profiles!task_comments_user_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as TaskCommentWithAuthor[]
}

export async function createTaskComment(
  payload: TaskCommentInsert,
  supabaseClient?: SupabaseClient<Database>
): Promise<TaskCommentWithAuthor> {
  const supabase = (supabaseClient || createBrowserClient()) as any
  validateCommentContent(payload.content || '')

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      ...payload,
      content: payload.content?.trim(),
    })
    .select(`
      *,
      author:profiles!task_comments_user_id_fkey(id, full_name, avatar_url, email)
    `)
    .single()

  if (error) throw error
  return data as TaskCommentWithAuthor
}

export async function updateTaskComment(
  commentId: string,
  userId: string,
  updates: Pick<TaskCommentUpdate, 'content' | 'mentioned_user_ids'>,
  supabaseClient?: SupabaseClient<Database>
): Promise<TaskCommentWithAuthor> {
  const supabase = (supabaseClient || createBrowserClient()) as any
  validateCommentContent(updates.content || '')

  const { data, error } = await supabase
    .from('task_comments')
    .update({
      content: updates.content?.trim(),
      mentioned_user_ids: updates.mentioned_user_ids || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select(`
      *,
      author:profiles!task_comments_user_id_fkey(id, full_name, avatar_url, email)
    `)
    .single()

  if (error) throw error
  return data as TaskCommentWithAuthor
}

export async function deleteTaskComment(
  commentId: string,
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<void> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw error
}
