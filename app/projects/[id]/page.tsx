import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/lib/supabase/queries/projects'
import { getTasks } from '@/lib/supabase/queries/tasks'
import { notFound } from 'next/navigation'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { ProjectProgressStats } from '@/components/projects/ProjectProgressStats'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Get project
  try {
    const project = await getProject(params.id, supabase)

    // Verify ownership
    if (project.user_id !== user.id) {
      notFound()
    }

    // Get tasks
    const tasks = await getTasks(params.id, supabase)

    return (
      <div className="space-y-6">
        <ProjectHeader project={project} />
        <ProjectProgressStats tasks={tasks || []} />
        <KanbanBoard projectId={params.id} initialTasks={tasks || []} userId={user.id} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}