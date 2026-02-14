import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompanyPageContent } from '@/components/company/CompanyPageContent'

export default async function CompanyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/onboarding')

  return <CompanyPageContent userId={user.id} companyId={profile.company_id} />
}
