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
    const { userId, subject, message, notificationId } = body

    if (!userId || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get recipient's profile to check notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, notifications_enabled')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!profile.notifications_enabled) {
      return NextResponse.json({ message: 'Email notifications disabled for this user' })
    }

    // In production, integrate with Resend, SendGrid, or Supabase Edge Functions
    // For now, we log and mark the notification as email_sent
    console.log(`[Email] To: ${profile.email}, Subject: ${subject}, Message: ${message}`)

    // Mark notification as email_sent if notificationId is provided
    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notificationId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to send email notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
