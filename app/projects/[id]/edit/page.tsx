import { createClient } from '@/lib/supabase/server'
import { getProject } from '@/lib/supabase/queries/projects'
import type { Project } from '@/lib/supabase/queries/projects'
import { notFound } from 'next/navigation'
import { EditProjectForm } from '@/components/projects/EditProjectForm'

interface EditProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  try {
    const project = (await getProject(id, supabase)) as Project

    // Verify ownership
    if (project.user_id !== user.id) {
      notFound()
    }

    return (
      <div className="max-w-2xl mx-auto">
        <EditProjectForm project={project} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
