import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const { data: invitation, error: invitationError } = await (supabase as any)
      .from('invitations')
      .select('id, email, status, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is not active' }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    if (!user.email || invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address' },
        { status: 403 }
      )
    }

    // Use SECURITY DEFINER RPC - handles full invitation acceptance flow
    const { data, error } = await (supabase as any).rpc('accept_company_invitation', {
      p_token: token,
    })

    if (error) {
      console.error('RPC accept_company_invitation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: data.status || 400 })
    }

    return NextResponse.json({ success: true, companyId: data.company_id })
  } catch (error: any) {
    console.error('Failed to accept invitation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
