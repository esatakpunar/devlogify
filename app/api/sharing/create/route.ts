import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createShareLink } from '@/lib/supabase/queries/sharing'
import { checkIsPremium } from '@/lib/utils/premium'

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

    const isPremium = await checkIsPremium(user.id, supabase)
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { resourceType, resourceId, expiresAt } = body

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const shareLink = await createShareLink(
      user.id,
      resourceType,
      resourceId,
      expiresAt ? new Date(expiresAt) : undefined
    )

    return NextResponse.json({ token: shareLink.token })
  } catch (error: any) {
    console.error('Error creating share link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    )
  }
}
