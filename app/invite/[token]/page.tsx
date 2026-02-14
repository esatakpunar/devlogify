import { createClient } from '@/lib/supabase/server'
import { InvitePageContent } from '@/components/invite/InvitePageContent'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <InvitePageContent
      token={token}
      isAuthenticated={!!user}
      userId={user?.id || null}
      userEmail={user?.email || null}
    />
  )
}
