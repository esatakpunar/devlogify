'use client'

import { ArrowLeft, Settings, MoreVertical, Edit, Archive, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProjectHeaderProps {
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: string
  }
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this project?')) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', project.id)

      if (error) throw error

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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      router.push('/dashboard/projects')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-lg flex-shrink-0" 
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.description && (
              <p className="text-gray-600 mt-2">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <Button variant="outline" disabled={loading}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={loading}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Project Settings
                </Link>
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
    </div>
  )
}