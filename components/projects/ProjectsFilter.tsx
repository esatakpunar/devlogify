'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function ProjectsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'active'
  const t = useTranslation()

  const filters = [
    { label: t('projects.filter.all'), value: 'all' },
    { label: t('projects.filter.active'), value: 'active' },
    { label: t('projects.filter.completed'), value: 'completed' },
    { label: t('projects.filter.archived'), value: 'archived' },
  ]

  const handleFilterChange = (value: string) => {
    router.push(`/projects?status=${value}`)
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 w-full sm:w-fit overflow-x-auto">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentStatus === filter.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange(filter.value)}
          className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}