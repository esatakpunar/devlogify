'use client'

import { StickyNote } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function NotesHeader() {
  const t = useTranslation()
  
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('notes.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {t('notes.captureYourIdeas')}
        </p>
      </div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <StickyNote className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
      </div>
    </div>
  )
}