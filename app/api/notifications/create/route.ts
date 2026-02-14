import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
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

    // Use SECURITY DEFINER RPC - no service_role key needed
    const { data, error } = await (supabase as any).rpc('create_company_notification', {
      p_user_id: userId,
      p_company_id: companyId,
      p_type: type,
      p_title: title,
      p_message: message || null,
      p_metadata: metadata || null,
    })

    if (error) {
      console.error('[API create notification] RPC error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create notification' }, { status: 500 })
    }

    if (data?.error) {
      console.error('[API create notification] Function error:', data.error)
      return NextResponse.json({ error: data.error }, { status: data.status || 400 })
    }

    return NextResponse.json({ notification: data?.notification })
  } catch (error: any) {
    console.error('Failed to create notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
