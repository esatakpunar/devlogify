export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
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