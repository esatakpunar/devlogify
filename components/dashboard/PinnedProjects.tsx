'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pin, PinOff, FolderKanban } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { toggleProjectPin } from '@/lib/supabase/queries/projects'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { ProjectWithTasks } from '@/lib/supabase/queries/projects'

interface PinnedProjectsProps {
  projects: ProjectWithTasks[]
  userId: string
}

export function PinnedProjects({ projects, userId }: PinnedProjectsProps) {
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set())
  const t = useTranslation()

  const handleTogglePin = async (projectId: string) => {
    setLoadingProjects(prev => new Set(prev).add(projectId))
    
    try {
      await toggleProjectPin(projectId)
      toast.success(t('pinnedProjects.projectPinStatusUpdated'))
      // The parent component should refetch data
    } catch (error) {
      toast.error(t('projects.failedToUpdatePinStatus'))
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
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('pinnedProjects.title')}</h3>
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
          <Pin className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm sm:text-base">{t('pinnedProjects.noPinnedProjects')}</p>
          <p className="text-xs sm:text-sm">{t('pinnedProjects.pinFavoriteProjects')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('pinnedProjects.title')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                >
                  {project.title}
                </Link>
                {project.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
              <Tooltip content={t('pinnedProjects.unpinProject')}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTogglePin(project.id)}
                  disabled={loadingProjects.has(project.id)}
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer flex-shrink-0"
                >
                  <PinOff className="w-3 h-3" />
                </Button>
              </Tooltip>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {project.tasks[0]?.count || 0} {project.tasks[0]?.count === 1 ? t('projects.task') : t('projects.tasks')}
                </span>
              </div>
              <Badge
                variant="secondary"
                className="text-xs flex-shrink-0"
                style={{ backgroundColor: project.color + '20', color: project.color }}
              >
                {t('common.active')}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
            <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('timerCard.manageAllProjects')}</span>
            <span className="sm:hidden">{t('timerCard.manageAllProjects')}</span>
          </Button>
        </Link>
      </div>
    </Card>
  )
}
