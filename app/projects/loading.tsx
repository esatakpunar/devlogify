import { ProjectsSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <LoadingSkeleton className="h-8 w-32 mb-2" />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton className="h-10 w-32" />
      </div>

      {/* Filter */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['All', 'Active', 'Completed'].map((tab) => (
          <LoadingSkeleton key={tab} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      {/* Projects Grid */}
      <ProjectsSkeleton />
    </div>
  )
}
