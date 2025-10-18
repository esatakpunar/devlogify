'use client'

import { StickyNote } from 'lucide-react'

export function NotesHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Notes</h1>
        <p className="text-gray-600 mt-1">
          Capture your ideas and thoughts
        </p>
      </div>
      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
        <StickyNote className="w-6 h-6 text-yellow-600" />
      </div>
    </div>
  )
}