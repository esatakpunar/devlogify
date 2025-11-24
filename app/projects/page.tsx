import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/supabase/queries/projects'
import { FolderKanban } from 'lucide-react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectsFilter } from '@/components/projects/ProjectsFilter'
import { ProjectsHeader } from '@/components/projects/ProjectsHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Suspense } from 'react'
import { ProjectsSkeleton } from '@/components/ui/LoadingSkeleton'

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string }>
}

async function ProjectsList({ status, userId }: { status: string; userId: string }) {
  const supabase = await createClient()

  const projects = await getProjects(
    userId,
    status !== 'all' ? status : undefined,
    supabase
  )

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={status !== 'all' ? `No ${status} projects yet` : 'No projects yet'}
        description="Get started by creating your first project to track your work"
        actionLabel="Create Project"
        actionHref="/projects/new"
      />
    )
  }

  // Sort projects: pinned first, then by updated_at
  const sortedProjects = projects.sort((a, b) => {
    // First sort by pinned status
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    
    // Then sort by updated_at
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedProjects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} userId={userId} />
      ))}
    </div>
  )
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams
  const status = params?.status || 'active'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProjectsHeader userId={user.id} />

      {/* Filter */}
      <Suspense fallback={<div>Loading filters...</div>}>
        <ProjectsFilter />
      </Suspense>

      {/* Projects Grid */}
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList status={status} userId={user.id} />
      </Suspense>
    </div>
  )
}