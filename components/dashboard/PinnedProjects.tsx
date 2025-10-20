'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pin, PinOff, FolderKanban } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleProjectPin } from '@/lib/supabase/queries/projects'
import { toast } from 'sonner'

interface Project {
  id: string
  title: string
  description: string | null
  color: string
  tasks: { count: number }[]
}

interface PinnedProjectsProps {
  projects: Project[]
  userId: string
}

export function PinnedProjects({ projects, userId }: PinnedProjectsProps) {
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set())

  const handleTogglePin = async (projectId: string) => {
    setLoadingProjects(prev => new Set(prev).add(projectId))
    
    try {
      await toggleProjectPin(projectId)
      toast.success('Project pin status updated')
      // The parent component should refetch data
    } catch (error) {
      toast.error('Failed to update pin status')
      console.error('Pin toggle error:', error)
    } finally {
      setLoadingProjects(prev => {
        const newSet = new Set(prev)
        newSet.delete(projectId)
        return newSet
      })
    }
  }

  if (projects.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pinned Projects</h3>
        <div className="text-center py-8 text-gray-500">
          <Pin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No pinned projects</p>
          <p className="text-sm">Pin your favorite projects for quick access</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Pinned Projects</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                >
                  {project.title}
                </Link>
                {project.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleTogglePin(project.id)}
                disabled={loadingProjects.has(project.id)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                title="Unpin project"
              >
                <PinOff className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs text-gray-500">
                  {project.tasks[0]?.count || 0} tasks
                </span>
              </div>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                Active
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="w-full">
            <FolderKanban className="w-4 h-4 mr-2" />
            Manage all projects
          </Button>
        </Link>
      </div>
    </Card>
  )
}
