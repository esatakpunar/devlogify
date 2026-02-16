import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    // Verify the requesting user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, companyId, type, title, message, metadata } = body

    if (!userId || !companyId || !type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the authenticated user is in the same company
    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this company' }, { status: 403 })
    }

    // Create admin client with service_role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API Notification] Missing Supabase service credentials')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey)

    // Insert notification directly (bypasses RLS with service_role)
    const { data: notification, error } = await (adminClient as any)
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
      console.error('[API Notification] Insert error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ notification })
  } catch (error: any) {
    console.error('[API Notification] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
