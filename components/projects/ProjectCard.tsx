'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreVertical, Calendar, ListTodo, Edit, Archive, Trash, Pin, PinOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { archiveProject, deleteProject, toggleProjectPin } from '@/lib/supabase/queries/projects'
import { logProjectDeleted } from '@/lib/supabase/queries/activities'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { AnimatedCard } from '@/components/ui/AnimatedCard'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: string
    is_pinned?: boolean
    created_at: string
    tasks?: { count: number }[]
  }
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const [loading, setLoading] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const taskCount = project.tasks?.[0]?.count ?? 0
  const isPinned = project.is_pinned || false

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this project? All tasks will be deleted.')) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await logProjectDeleted(user.id, project.id, project.title)
      }

      await deleteProject(project.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setPinLoading(true)
    try {
      await toggleProjectPin(project.id)
      toast.success(isPinned ? 'Project unpinned' : 'Project pinned')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update pin status')
      console.error('Pin toggle error:', error)
    } finally {
      setPinLoading(false)
    }
  }

  return (
    <AnimatedCard delay={index * 0.05}>
      <Link href={`/projects/${project.id}`}>
        <div className="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all p-6 cursor-pointer">
          {/* Color bar */}
          <div 
            className="w-full h-1 rounded-full mb-4" 
            style={{ backgroundColor: project.color }}
          />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isPinned && (
                <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors dark:text-white">
                {project.title}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePinToggle}
                disabled={pinLoading}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer"
                title={isPinned ? "Unpin project" : "Pin project"}
              >
                {isPinned ? (
                  <PinOff className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Pin className="h-4 w-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                )}
              </Button>
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
                  <Link href={`/projects/${project.id}/edit`}>
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
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
              {project.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ListTodo className="w-4 h-4" />
                <span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </AnimatedCard>
  )
}