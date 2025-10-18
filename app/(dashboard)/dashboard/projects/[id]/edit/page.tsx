import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditProjectForm } from '@/components/projects/EditProjectForm'

interface EditProjectPageProps {
  params: {
    id: string
  }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single()

  if (error || !project) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <EditProjectForm project={project} />
    </div>
  )
}