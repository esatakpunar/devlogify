import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function SettingsLoading() {
  return (
    <div className="w-full max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <LoadingSkeleton className="h-9 w-48 mb-2" />
        <LoadingSkeleton className="h-5 w-96" />
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden">
        {/* Tab List */}
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <div className="flex gap-2 min-w-full">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2.5 min-w-[60px]">
                <LoadingSkeleton className="h-4 w-4 rounded" />
                <LoadingSkeleton className="h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <LoadingSkeleton className="h-6 w-24 mb-6" />
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <LoadingSkeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <LoadingSkeleton className="h-5 w-32 mb-2" />
                <LoadingSkeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="grid gap-4">
              <div>
                <LoadingSkeleton className="h-4 w-16 mb-2" />
                <LoadingSkeleton className="h-10 w-full" />
              </div>
              <div>
                <LoadingSkeleton className="h-4 w-16 mb-2" />
                <LoadingSkeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Sidebar + Content */}
      <div className="hidden md:flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2 sticky top-6">
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-md">
                  <LoadingSkeleton className="h-5 w-5 rounded" />
                  <LoadingSkeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <LoadingSkeleton className="h-7 w-32 mb-6" />
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <LoadingSkeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1">
                  <LoadingSkeleton className="h-5 w-32 mb-2" />
                  <LoadingSkeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <LoadingSkeleton className="h-4 w-16 mb-2" />
                  <LoadingSkeleton className="h-10 w-full" />
                </div>
                <div>
                  <LoadingSkeleton className="h-4 w-16 mb-2" />
                  <LoadingSkeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1">
                      <LoadingSkeleton className="h-4 w-32 mb-1" />
                      <LoadingSkeleton className="h-3 w-48" />
                    </div>
                    <LoadingSkeleton className="h-6 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
