'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateProjectDialog } from './CreateProjectDialog'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProjectsHeaderProps {
  userId: string
}

export function ProjectsHeader({ userId }: ProjectsHeaderProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const t = useTranslation()

  const handleProjectCreated = () => {
    // Force refresh the page to update the projects list
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t('projects.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('projects.manageProjects')}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('projects.newProject')}</span>
          <span className="sm:hidden">{t('projects.newProject')}</span>
        </Button>
      </div>
      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        onProjectCreated={handleProjectCreated}
      />
    </>
  )
}

