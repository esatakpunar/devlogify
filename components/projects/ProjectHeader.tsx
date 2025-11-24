'use client'

import { ArrowLeft, Settings, MoreVertical, Edit, Archive, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { archiveProject, deleteProject } from '@/lib/supabase/queries/projects'
import { logProjectDeleted } from '@/lib/supabase/queries/activities'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditProjectDialog } from './EditProjectDialog'

interface ProjectHeaderProps {
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
  }
  userId: string
}

export function ProjectHeader({ project, userId }: ProjectHeaderProps) {
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this project?')) return

    setLoading(true)
    try {
      await archiveProject(project.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to archive project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks.')) {
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await logProjectDeleted(user.id, project.id, project.title)
      }

      await deleteProject(project.id)

      router.push('/projects')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div 
            className="w-12 h-12 rounded-lg flex-shrink-0" 
            style={{ backgroundColor: project.color }}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold break-words">{project.title}</h1>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2 break-words overflow-wrap-anywhere">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            disabled={loading}
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={loading}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Project Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Archive Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="w-4 h-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={{
          id: project.id,
          title: project.title,
          description: project.description,
          color: project.color,
          status: project.status,
        }}
        userId={userId}
        onProjectUpdated={() => {
          router.refresh()
        }}
      />
    </div>
  )
}