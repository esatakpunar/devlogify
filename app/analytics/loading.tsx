import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <LoadingSkeleton className="h-8 w-32 mb-2" />
        <LoadingSkeleton className="h-4 w-80" />
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LoadingSkeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <LoadingSkeleton className="h-8 w-16 mx-auto mb-2" />
              <LoadingSkeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LoadingSkeleton className="h-6 w-32 mb-4" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LoadingSkeleton className="h-6 w-32 mb-4" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LoadingSkeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <LoadingSkeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <LoadingSkeleton className="h-4 w-3/4 mb-1" />
                <LoadingSkeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
