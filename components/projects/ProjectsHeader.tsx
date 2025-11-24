'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateProjectDialog } from './CreateProjectDialog'

interface ProjectsHeaderProps {
  userId: string
}

export function ProjectsHeader({ userId }: ProjectsHeaderProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleProjectCreated = () => {
    // Force refresh the page to update the projects list
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your projects and track progress
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
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

