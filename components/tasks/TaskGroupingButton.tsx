'use client'

import { useState } from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskGroupingDialog } from './TaskGroupingDialog'
import { usePremium } from '@/lib/hooks/usePremium'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TaskGroupingButtonProps {
  projectId: string
  userId: string
  onTasksUpdated?: () => void
}

export function TaskGroupingButton({ projectId, userId, onTasksUpdated }: TaskGroupingButtonProps) {
  const { isPremium } = usePremium(userId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const t = useTranslation()

  // Don't show button if user is not premium
  if (!isPremium) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
      >
        <Layers className="w-4 h-4 mr-2" />
        {t('kanban.groupTasks')}
      </Button>
      <TaskGroupingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        userId={userId}
        onTasksUpdated={onTasksUpdated}
      />
    </>
  )
}

