import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import { invitationEmailTemplate } from '@/lib/email/templates'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, companyId, token, role, expiresAt } = body

    if (!email || !companyId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get company name
    const { data: company } = await (supabase as any)
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get inviter name
    const { data: inviter } = await (supabase as any)
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviter?.full_name || inviter?.email || 'Someone'

    const template = invitationEmailTemplate({
      companyName: company.name,
      inviterName,
      role: role || 'member',
      token,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    })

    if (!result.success) {
      console.error('[Invitation Email] Send failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id })
  } catch (error: any) {
    console.error('Failed to send invitation email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
