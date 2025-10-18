import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', params.id)
    .order('order_index', { ascending: true })

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />
      <KanbanBoard projectId={params.id} initialTasks={tasks || []} userId={user?.id || ''} />
    </div>
  )
}