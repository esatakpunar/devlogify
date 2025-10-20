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

      {/* Main Dashboard Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recent Tasks */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <LoadingSkeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <LoadingSkeleton className="h-4 w-3/4 mb-2" />
                    <div className="flex items-center gap-2">
                      <LoadingSkeleton className="h-3 w-16" />
                      <LoadingSkeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <LoadingSkeleton className="h-8 w-8 rounded" />
                    <LoadingSkeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today Completed */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <LoadingSkeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex-1">
                    <LoadingSkeleton className="h-4 w-2/3 mb-2" />
                    <div className="flex items-center gap-2">
                      <LoadingSkeleton className="h-3 w-16" />
                      <LoadingSkeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Timer */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <LoadingSkeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <LoadingSkeleton className="h-4 w-3/4 mb-1" />
                    <LoadingSkeleton className="h-3 w-1/2" />
                  </div>
                  <LoadingSkeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Pinned Projects */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <LoadingSkeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <LoadingSkeleton className="h-4 w-3/4 mb-2" />
                  <LoadingSkeleton className="h-3 w-full mb-2" />
                  <div className="flex items-center justify-between">
                    <LoadingSkeleton className="h-3 w-16" />
                    <LoadingSkeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
