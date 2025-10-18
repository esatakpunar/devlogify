import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FolderKanban } from 'lucide-react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectsFilter } from '@/components/projects/ProjectsFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import { Suspense } from 'react'
import { ProjectsSkeleton } from '@/components/ui/LoadingSkeleton'

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string }>
}

async function ProjectsList({ status }: { status: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: projects } = await query

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={status !== 'all' ? `No ${status} projects yet` : 'No projects yet'}
        description="Get started by creating your first project to track your work"
        actionLabel="Create Project"
        onAction={() => window.location.href = '/dashboard/projects/new'}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  )
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams
  const status = params?.status || 'active'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your projects and track progress
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <Suspense fallback={<div>Loading filters...</div>}>
        <ProjectsFilter />
      </Suspense>

      {/* Projects Grid */}
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList status={status} />
      </Suspense>
    </div>
  )
}