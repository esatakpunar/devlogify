'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Clock, 
  BarChart3, 
  StickyNote,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects', href: '/projects', icon: FolderKanban },
  { key: 'timeline', href: '/timeline', icon: Clock },
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'notes', href: '/notes', icon: StickyNote },
]

interface SidebarProps {
  onLinkClick?: () => void
}

export function Sidebar({ onLinkClick }: SidebarProps = {}) {
  const pathname = usePathname()
  const t = useTranslation()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" onClick={onLinkClick} className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-xl font-bold">Devlogify</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-gray-200 p-3">
        <Link
          href="/settings"
          onClick={onLinkClick}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>{t('common.settings')}</span>
        </Link>
      </div>
    </div>
  )
}