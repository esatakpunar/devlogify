import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { getShareLinkByToken, incrementShareLinkViews } from '@/lib/supabase/queries/sharing'
import { getProject } from '@/lib/supabase/queries/projects'
import { getTasks } from '@/lib/supabase/queries/tasks'
import { SharedProjectView } from '@/components/sharing/SharedProjectView'

interface SharePageProps {
  params: Promise<{
    token: string
  }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  
  // Use public client for share link access
  const publicSupabase = createPublicClient()
  const shareLink = await getShareLinkByToken(token, publicSupabase)
  
  if (!shareLink) {
    notFound()
  }

  // Increment view count
  await incrementShareLinkViews(token, publicSupabase)

  if (shareLink.resource_type === 'project') {
    const project = await getProject(shareLink.resource_id, publicSupabase)
    const tasks = await getTasks(shareLink.resource_id, publicSupabase)

    if (!project) {
      notFound()
    }

    return (
      <SharedProjectView
        project={project}
        tasks={tasks || []}
        shareLink={shareLink}
      />
    )
  }

  // Only project sharing is supported
  notFound()
}

