import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function TimelineLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <LoadingSkeleton className="h-8 w-32 mb-2" />
        <LoadingSkeleton className="h-4 w-80" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <LoadingSkeleton className="h-4 w-20 mb-2" />
                <LoadingSkeleton className="h-8 w-16" />
                <LoadingSkeleton className="h-3 w-12 mt-1" />
              </div>
              <LoadingSkeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Content */}
      <div className="space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 w-fit">
          {['All', 'Today', 'This Week', 'This Month'].map((filter) => (
            <LoadingSkeleton key={filter} className="h-8 w-20 rounded-md" />
          ))}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <LoadingSkeleton className="h-2 w-2 rounded-full mt-2" />
              <div className="flex-1">
                <LoadingSkeleton className="h-4 w-3/4 mb-2" />
                <LoadingSkeleton className="h-3 w-1/2 mb-1" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
