import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: invitation, error } = await (supabase as any)
      .from('invitations')
      .select(`
        id, email, role, status, expires_at, created_at,
        company:companies!invitations_company_id_fkey(id, name, logo_url),
        invited_by_profile:profiles!invitations_invited_by_fkey(full_name, email)
      `)
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: 'Invitation already accepted', status: 'accepted' }, { status: 400 })
    }

    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired', status: 'expired' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.company?.name,
        companyLogo: invitation.company?.logo_url,
        inviterName: invitation.invited_by_profile?.full_name || invitation.invited_by_profile?.email,
        expiresAt: invitation.expires_at,
      },
    })
  } catch (error: any) {
    console.error('Failed to verify invitation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
