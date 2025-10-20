import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <LoadingSkeleton className="h-8 w-32 mb-2" />
          <LoadingSkeleton className="h-4 w-48" />
        </div>
        <LoadingSkeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <LoadingSkeleton className="h-4 w-20 mb-2" />
                <LoadingSkeleton className="h-8 w-16" />
              </div>
              <LoadingSkeleton className="h-12 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <LoadingSkeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <LoadingSkeleton className="h-8 w-8 mb-2" />
              <LoadingSkeleton className="h-5 w-24 mb-1" />
              <LoadingSkeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
