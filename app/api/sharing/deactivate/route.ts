import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deactivateShareLink } from '@/lib/supabase/queries/sharing'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      )
    }

    await deactivateShareLink(token, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deactivating share link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate share link' },
      { status: 500 }
    )
  }
}

