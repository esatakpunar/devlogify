'use client'

import { useState } from 'react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskGroupingDialog } from './TaskGroupingDialog'

interface TaskGroupingButtonProps {
  projectId: string
  userId: string
  onTasksUpdated?: () => void
}

export function TaskGroupingButton({ projectId, userId, onTasksUpdated }: TaskGroupingButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
      >
        <Layers className="w-4 h-4 mr-2" />
        Group Tasks
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

