import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <LoadingSkeleton className="h-8 w-32 mb-2" />
        <LoadingSkeleton className="h-4 w-80" />
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LoadingSkeleton className="h-6 w-20 mb-4" />
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
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200" />

      {/* Preferences Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LoadingSkeleton className="h-6 w-24 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <LoadingSkeleton className="h-4 w-24 mb-1" />
                <LoadingSkeleton className="h-3 w-48" />
              </div>
              <LoadingSkeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200" />

      {/* Account Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <LoadingSkeleton className="h-6 w-20 mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <LoadingSkeleton className="h-4 w-24 mb-1" />
                <LoadingSkeleton className="h-3 w-48" />
              </div>
              <LoadingSkeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
