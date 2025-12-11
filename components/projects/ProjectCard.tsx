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
import { getPlainTextFromHTML } from '@/components/ui/HTMLContent'
import { EditProjectDialog } from './EditProjectDialog'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
    is_pinned?: boolean
    created_at: string
    tasks?: { count: number }[]
  }
  index?: number
  userId?: string
}

export function ProjectCard({ project, index = 0, userId }: ProjectCardProps) {
  const [loading, setLoading] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()
  const { confirm, confirmWithAction, Modal: ConfirmModal } = useConfirmModal()

  const taskCount = project.tasks?.[0]?.count ?? 0
  const isPinned = project.is_pinned || false

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    const confirmed = await confirm({
      title: t('projects.areYouSureArchiveProject'),
      description: t('projects.archiveProjectDescription') || undefined,
      confirmText: t('projects.archive'),
      cancelText: t('common.cancel'),
      variant: 'default',
    })

    if (!confirmed) return

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
    const confirmed = await confirm({
      title: t('projects.areYouSureDeleteProjectWithTasks'),
      description: t('projects.deleteProjectDescription') || undefined,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    })

    if (!confirmed) return

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
      toast.success(isPinned ? t('projects.projectUnpinned') : t('projects.projectPinned'))
      router.refresh()
    } catch (error) {
      toast.error(t('projects.failedToUpdatePinStatus'))
      console.error('Pin toggle error:', error)
    } finally {
      setPinLoading(false)
    }
  }

  return (
    <AnimatedCard delay={index * 0.05}>
      <Link href={`/projects/${project.id}`}>
        <div className="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all p-4 sm:p-6 cursor-pointer">
          {/* Color bar */}
          <div 
            className="w-full h-1 rounded-full mb-3 sm:mb-4" 
            style={{ backgroundColor: project.color }}
          />

          {/* Header */}
          <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isPinned && (
                <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-base sm:text-lg line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors dark:text-white">
                {project.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePinToggle}
                disabled={pinLoading}
                className="h-7 w-7 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer"
                title={isPinned ? t('projects.unpinProject') : t('projects.pinProject')}
              >
                {isPinned ? (
                  <PinOff className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Pin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    disabled={loading}
                  >
                    <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (userId) {
                    setEditDialogOpen(true)
                  }
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  {t('projects.archive')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <div className="min-h-[2rem] sm:min-h-[2.5rem] mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {project.description ? getPlainTextFromHTML(project.description) : '\u00A0'}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <ListTodo className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">{taskCount} {taskCount === 1 ? t('projects.task') : t('projects.tasks')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {userId && (
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
      )}
      {ConfirmModal}
    </AnimatedCard>
  )
}