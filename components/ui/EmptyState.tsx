import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import Link from 'next/link'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  tips?: string[]
  examples?: ReactNode
  variant?: 'default' | 'minimal' | 'featured'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tips,
  examples,
  variant = 'default'
}: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
          {description}
        </p>
        {actionLabel && actionHref && (
          <Link href={actionHref}>
            <Button size="sm">
              {actionLabel}
            </Button>
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
      <div className="relative mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
        </div>
        {variant === 'featured' && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xs">✨</span>
          </div>
        )}
      </div>
      
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6 text-sm sm:text-base">
        {description}
      </p>

      {examples && (
        <div className="w-full max-w-md mb-6">
          {examples}
        </div>
      )}

      {tips && tips.length > 0 && (
        <div className="w-full max-w-md mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Quick Tips:</p>
          <ul className="space-y-1.5 text-xs text-blue-800 dark:text-blue-400">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="lg" className="shadow-md">
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button size="lg" onClick={onAction} className="shadow-md">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}