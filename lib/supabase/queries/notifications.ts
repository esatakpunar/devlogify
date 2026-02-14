import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database, NotificationType } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Notification = Database['public']['Tables']['notifications']['Row']

export async function getNotifications(
  userId: string,
  companyId: string,
  limit: number = 20,
  offset: number = 0,
  supabaseClient?: SupabaseClient<Database>
) {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getUnreadCount(
  userId: string,
  companyId: string,
  supabaseClient?: SupabaseClient<Database>
) {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('is_read', false)

  if (error) throw error
  return count || 0
}

export async function markAsRead(notificationId: string) {
  const supabase = createBrowserClient() as any

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllAsRead(userId: string, companyId: string) {
  const supabase = createBrowserClient() as any

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .eq('is_read', false)

  if (error) throw error
}

export async function createNotification(
  userId: string,
  companyId: string,
  type: NotificationType,
  title: string,
  message?: string,
  metadata?: Record<string, any>,
  supabaseClient?: SupabaseClient<Database>
) {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      company_id: companyId,
      type,
      title,
      message: message || null,
      metadata: metadata || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[createNotification] Error:', JSON.stringify(error), 'Code:', error.code, 'Message:', error.message, 'Details:', error.details, 'Hint:', error.hint)
    throw error
  }
  return data
}
