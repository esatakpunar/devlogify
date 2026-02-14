import { createClient } from '@/lib/supabase/server'
import { getUserCompanyId } from '@/lib/supabase/queries/companyMembership'
import { redirect } from 'next/navigation'
import { CompanyPageContent } from '@/components/company/CompanyPageContent'

export default async function CompanyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const companyId = await getUserCompanyId(user.id, supabase)

  if (!companyId) redirect('/onboarding')

  return <CompanyPageContent userId={user.id} companyId={companyId} />
}
