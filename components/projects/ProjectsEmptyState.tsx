'use client'

import { FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'

interface ProjectsEmptyStateProps {
  status: string
  onOpenCreateDialog: () => void
}

export function ProjectsEmptyState({ status, onOpenCreateDialog }: ProjectsEmptyStateProps) {
  return (
    <EmptyState
      icon={FolderKanban}
      title={status !== 'all' ? `No ${status} projects yet` : 'No projects yet'}
      description="Get started by creating your first project to track your work"
      actionLabel="Create Project"
      onAction={onOpenCreateDialog}
    />
  )
}

