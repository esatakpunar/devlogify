import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function NotesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <LoadingSkeleton className="h-8 w-24 mb-2" />
          <LoadingSkeleton className="h-4 w-64" />
        </div>
        <LoadingSkeleton className="h-12 w-12 rounded-lg" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <LoadingSkeleton className="h-10 w-full rounded-md" />
        </div>
        <LoadingSkeleton className="h-10 w-32" />
      </div>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <LoadingSkeleton className="h-5 w-3/4 mb-3" />
            <LoadingSkeleton className="h-4 w-full mb-2" />
            <LoadingSkeleton className="h-4 w-2/3 mb-4" />
            <div className="flex items-center justify-between">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
