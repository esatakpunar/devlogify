import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingContent } from '@/components/onboarding/OnboardingContent'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (profile?.company_id) {
    redirect('/dashboard')
  }

  return <OnboardingContent userId={user.id} userEmail={user.email || ''} />
}
