'use client'

import { FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ProjectsEmptyStateProps {
  status: string
  onOpenCreateDialog: () => void
}

export function ProjectsEmptyState({ status, onOpenCreateDialog }: ProjectsEmptyStateProps) {
  const t = useTranslation()
  
  const title = status !== 'all' 
    ? t('projects.noStatusProjects', { status: t(`common.${status}`) })
    : t('projects.noProjects')
  
  return (
    <EmptyState
      icon={FolderKanban}
      title={title}
      description={t('projects.getStartedByCreating')}
      actionLabel={t('projects.newProject')}
      onAction={onOpenCreateDialog}
    />
  )
}

