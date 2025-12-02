export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <LoadingSkeleton className="h-3 sm:h-4 w-20 mb-2" />
              <LoadingSkeleton className="h-6 sm:h-8 w-16" />
            </div>
            <LoadingSkeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0 ml-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardContentSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Left Column */}
      <div className="space-y-4 sm:space-y-6">
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <LoadingSkeleton className="h-5 sm:h-6 w-32 mb-4" />
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <LoadingSkeleton className="h-4 w-3/4" />
                    <LoadingSkeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <LoadingSkeleton className="h-3 w-12" />
                    <LoadingSkeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                  <LoadingSkeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
                  <LoadingSkeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today Completed */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <LoadingSkeleton className="h-5 sm:h-6 w-32 mb-4" />
          <div className="space-y-2 sm:space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
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
      <div className="space-y-4 sm:space-y-6">
        {/* Quick Timer */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <LoadingSkeleton className="h-5 sm:h-6 w-32 mb-4" />
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <LoadingSkeleton className="h-5 sm:h-6 w-32 mb-4" />
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
  )
}

export function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <LoadingSkeleton className="w-full h-1 mb-4" />
          <LoadingSkeleton className="h-6 w-3/4 mb-2" />
          <LoadingSkeleton className="h-4 w-full mb-4" />
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TasksSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <LoadingSkeleton className="h-5 w-3/4 mb-2" />
          <LoadingSkeleton className="h-4 w-full mb-3" />
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-4 w-16" />
            <LoadingSkeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <LoadingSkeleton className="h-5 w-3/4 mb-3" />
          <LoadingSkeleton className="h-4 w-full mb-2" />
          <LoadingSkeleton className="h-4 w-5/6 mb-4" />
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-3 w-20" />
            <LoadingSkeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}