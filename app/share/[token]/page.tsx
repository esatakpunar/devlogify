import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { getShareLinkByToken, incrementShareLinkViews } from '@/lib/supabase/queries/sharing'
import { SharedProjectView } from '@/components/sharing/SharedProjectView'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Prefer service-role on server for stable public share rendering under strict RLS.
    const queryClient =
      supabaseUrl && serviceRoleKey
        ? createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : publicSupabase

    const { data: project, error: projectError } = await (queryClient as any)
      .from('projects')
      .select('id, title, description, color, status, created_at')
      .eq('id', shareLink.resource_id)
      .maybeSingle()

    if (projectError) {
      console.error('[SharePage] Failed to load shared project:', projectError)
      notFound()
    }

    const { data: tasksData, error: tasksError } = await (queryClient as any)
      .from('tasks')
      .select('id, task_number, project_id, title, description, status, priority, estimated_duration, actual_duration, progress, order_index, created_at, tags')
      .eq('project_id', shareLink.resource_id)
      .order('order_index', { ascending: true })

    if (!project) {
      notFound()
    }

    if (tasksError) {
      console.error('[SharePage] Failed to load shared project tasks:', tasksError)
      notFound()
    }

    return (
      <SharedProjectView
        project={project}
        tasks={tasksData || []}
        shareLink={shareLink}
      />
    )
  }

  // Only project sharing is supported
  notFound()
}
