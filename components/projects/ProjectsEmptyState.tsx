'use client'

import { FolderKanban, Lightbulb, Rocket, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Card } from '@/components/ui/card'

interface ProjectsEmptyStateProps {
  status: string
  onOpenCreateDialog: () => void
}

export function ProjectsEmptyState({ status, onOpenCreateDialog }: ProjectsEmptyStateProps) {
  const t = useTranslation()
  
  const title = status !== 'all' 
    ? t('projects.noStatusProjects', { status: t(`common.${status}`) })
    : t('projects.noProjects')
  
  const isFirstProject = status === 'all'
  
  const tips = isFirstProject ? [
    t('projects.emptyStateTips.organizeWork'),
    t('projects.emptyStateTips.trackTime'),
    t('projects.emptyStateTips.setGoals'),
    t('projects.emptyStateTips.collaborate')
  ] : undefined

  const examples = isFirstProject ? (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center mb-3">
        {t('projects.exampleProjectsTitle')}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Rocket, title: t('projects.exampleProjectWebApp'), color: 'bg-blue-500' },
          { icon: Target, title: t('projects.exampleProjectMarketing'), color: 'bg-green-500' },
          { icon: Lightbulb, title: t('projects.exampleProjectProduct'), color: 'bg-yellow-500' },
        ].map((project, index) => (
          <Card key={index} className="p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={onOpenCreateDialog}>
            <project.icon className={`w-6 h-6 mx-auto mb-2 ${project.color} text-white p-1.5 rounded-lg`} />
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{project.title}</p>
          </Card>
        ))}
      </div>
    </div>
  ) : undefined
  
  return (
    <EmptyState
      icon={FolderKanban}
      title={title}
      description={isFirstProject 
        ? t('projects.getStartedByCreating') 
        : t('projects.noStatusProjectsDescription', { status: t(`common.${status}`) })
      }
      actionLabel={t('projects.newProject')}
      onAction={onOpenCreateDialog}
      tips={tips}
      examples={examples}
      variant={isFirstProject ? 'featured' : 'default'}
    />
  )
}

