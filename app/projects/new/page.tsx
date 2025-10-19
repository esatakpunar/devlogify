import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CreateProjectForm } from '@/components/projects/CreateProjectForm'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CreateProjectForm />
    </div>
  )
}
