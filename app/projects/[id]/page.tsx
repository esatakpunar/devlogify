import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProject } from '@/lib/supabase/queries/projects'
import { getTasks } from '@/lib/supabase/queries/tasks'
import { notFound } from 'next/navigation'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { ProjectContent } from '@/components/projects/ProjectContent'

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    redirect('/onboarding')
  }

  const companyId = profile.company_id

  // Get project
  try {
    const project = await getProject(id, supabase)

    // Verify company ownership
    if (project.company_id !== companyId && project.user_id !== user.id) {
      notFound()
    }

    // Get tasks
    const tasks = await getTasks(id, supabase)

    return (
      <div className="space-y-4 sm:space-y-6">
        <ProjectHeader project={project} userId={user.id} />
        <ProjectContent
          projectId={id}
          initialTasks={tasks || []}
          userId={user.id}
          project={{ id: project.id, title: project.title, color: project.color }}
        />
      </div>
    )
  } catch (error) {
    notFound()
  }
}