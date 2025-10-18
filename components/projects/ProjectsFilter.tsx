'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ProjectsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'active'

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
  ]

  const handleFilterChange = (value: string) => {
    router.push(`/dashboard/projects?status=${value}`)
  }

  return (
    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 w-fit">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentStatus === filter.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}