import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If it's a password recovery, redirect to reset password page
      // The reset password page will handle PASSWORD_RECOVERY event
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      
      // Normal flow - redirect to dashboard or next
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // On error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}