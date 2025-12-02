'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, FolderKanban, FileText, BarChart3, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslation()

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { path: '/projects', icon: FolderKanban, label: t('nav.projects') },
    { path: '/notes', icon: FileText, label: t('nav.notes') },
    { path: '/analytics', icon: BarChart3, label: t('nav.analytics') },
    { path: '/timeline', icon: Clock, label: t('nav.timeline') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors min-w-0',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap truncate max-w-full px-0.5">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

