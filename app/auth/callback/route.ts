import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
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
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      // Check if user has a company
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const companyId = await getUserCompanyId(user.id, supabase)

        if (!companyId) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // On error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
