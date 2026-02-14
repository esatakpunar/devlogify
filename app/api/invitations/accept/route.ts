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
