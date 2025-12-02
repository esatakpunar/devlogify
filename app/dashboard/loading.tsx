import { LoadingSkeleton, DashboardStatsSkeleton, DashboardContentSkeleton } from '@/components/ui/LoadingSkeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <LoadingSkeleton className="h-7 sm:h-9 w-32 sm:w-40 mb-2" />
          <LoadingSkeleton className="h-4 sm:h-5 w-48 sm:w-64" />
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStatsSkeleton />

      {/* Main Dashboard Content */}
      <DashboardContentSkeleton />
    </div>
  )
}
