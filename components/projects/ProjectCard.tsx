'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MoreVertical, Calendar, ListTodo, Edit, Archive, Trash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: string
    created_at: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this project? All tasks will be deleted.')) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-6 cursor-pointer">
        {/* Color bar */}
        <div 
          className="w-full h-1 rounded-full mb-4" 
          style={{ backgroundColor: project.color }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
            {project.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={loading}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ListTodo className="w-4 h-4" />
              <span>0 tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}