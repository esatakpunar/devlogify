import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { redirect } from 'next/navigation'
import { OnboardingContent } from '@/components/onboarding/OnboardingContent'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a company membership
  const companyId = await getUserCompanyId(user.id, supabase)

  if (companyId) {
    redirect('/dashboard')
  }

  return <OnboardingContent userId={user.id} userEmail={user.email || ''} />
}
