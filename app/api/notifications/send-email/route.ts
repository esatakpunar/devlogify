import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import { notificationEmailTemplate } from '@/lib/email/templates'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, subject, message, notificationId, type } = body

    if (!userId || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use SECURITY DEFINER RPC to get other user's email prefs
    const { data: prefs, error: prefsError } = await (supabase as any).rpc('get_member_email_prefs', {
      p_user_id: userId,
    })

    if (prefsError) {
      console.error('[Email] Failed to get email prefs:', prefsError)
      return NextResponse.json({ error: 'Failed to get user preferences' }, { status: 500 })
    }

    if (prefs?.error) {
      return NextResponse.json({ error: prefs.error }, { status: 404 })
    }

    if (!prefs?.notifications_enabled) {
      return NextResponse.json({ message: 'Email notifications disabled for this user' })
    }

    // Send email via Resend
    const template = notificationEmailTemplate({
      title: subject,
      message,
      type: type || 'general',
    })

    const result = await sendEmail({
      to: prefs.email,
      subject: template.subject,
      html: template.html,
    })

    // Mark notification as email_sent if notificationId is provided
    if (notificationId && result.success) {
      await (supabase as any)
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notificationId)
    }

    if (!result.success) {
      console.error('[Email] Send failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id })
  } catch (error: any) {
    console.error('Failed to send email notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
