'use client'

import { ArrowLeft, Settings, MoreVertical, Edit, Archive, Trash, Share2 } from 'lucide-react'
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
import { ShareDialog } from './ShareDialog'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const { isPremium } = usePremium(userId)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()
  const { confirm, confirmWithAction, Modal: ConfirmModal } = useConfirmModal()

  const handleShareClick = () => {
    if (!isPremium) {
      setUpgradeDialogOpen(true)
      return
    }
    setShareDialogOpen(true)
  }

  const handleArchive = async () => {
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

  const handleDelete = async () => {
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

      router.push('/projects')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile: Compact back button, Desktop: Full button */}
      <div className="flex items-center justify-between gap-2 md:block">
        <Link href="/projects" className="md:w-auto">
          <Button variant="ghost" size="sm" className="w-auto md:w-auto">
            <ArrowLeft className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{t('projects.backToProjects')}</span>
          </Button>
        </Link>
        {/* Mobile: Show action buttons in header for better UX */}
        <div className="flex items-center gap-1 md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            disabled={loading}
            onClick={handleShareClick}
            className="h-8 w-8"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            disabled={loading}
            onClick={() => setEditDialogOpen(true)}
            className="h-8 w-8"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={loading} className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                {t('projects.projectSettings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                {t('projects.archiveProject')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="w-4 h-4 mr-2" />
                {t('projects.deleteProject')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0" 
            style={{ backgroundColor: project.color }}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold break-words dark:text-white">{project.title}</h1>
            {project.description && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 break-words overflow-wrap-anywhere">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Desktop: Show action buttons */}
        <div className="hidden md:flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button 
            variant="outline" 
            disabled={loading}
            onClick={handleShareClick}
            size="sm"
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('sharing.share')}</span>
          </Button>
          
          <Button 
            variant="outline" 
            disabled={loading}
            onClick={() => setEditDialogOpen(true)}
            size="sm"
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('common.edit')}</span>
            <span className="sm:hidden">{t('common.edit')}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={loading} className="h-9 w-9 sm:h-10 sm:w-10">
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                {t('projects.projectSettings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                {t('projects.archiveProject')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash className="w-4 h-4 mr-2" />
                {t('projects.deleteProject')}
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
      
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        resourceType="project"
        resourceId={project.id}
        userId={userId}
      />
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Share & Export"
      />
      {ConfirmModal}
    </div>
  )
}