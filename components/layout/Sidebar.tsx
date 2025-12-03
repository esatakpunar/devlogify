'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Clock, 
  BarChart3, 
  StickyNote,
  Settings,
  ChevronLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useSidebarCollapse } from '@/lib/hooks/useSidebarCollapse'

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
  const { isCollapsed, toggleCollapse } = useSidebarCollapse()

  return (
    <motion.div
      className="flex h-full flex-col bg-white border-r border-gray-200 overflow-hidden"
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 256, // 64px for collapsed, 256px (w-64) for expanded
      }}
      transition={{
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smooth animation
      }}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-gray-200 shrink-0",
        isCollapsed ? "justify-center" : ""
      )}>
        <Link 
          href="/dashboard" 
          onClick={onLinkClick} 
          className={cn(
            "flex items-center transition-all duration-200",
            isCollapsed ? "justify-center" : "space-x-2 px-6"
          )}
        >
          <Image 
            src="/favicon.ico" 
            alt="Devlogify" 
            width={32} 
            height={32} 
            className="w-8 h-8 shrink-0"
          />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                key="logo-text"
                className="text-xl font-bold whitespace-nowrap"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                Devlogify
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors group relative',
                isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={isCollapsed ? t(`nav.${item.key}`) : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    key={`nav-${item.key}`}
                    className="whitespace-nowrap"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {t(`nav.${item.key}`)}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                  {t(`nav.${item.key}`)}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Settings and Collapse Button */}
      <div className="border-t border-gray-200 p-3 space-y-1 shrink-0">
        <Link
          href="/settings"
          onClick={onLinkClick}
          className={cn(
            'flex items-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors group relative',
            isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2'
          )}
          title={isCollapsed ? t('common.settings') : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                key="settings-text"
                className="whitespace-nowrap"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                {t('common.settings')}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
              {t('common.settings')}
            </div>
          )}
        </Link>
        
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'flex items-center w-full rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors',
            isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2'
          )}
          aria-label={isCollapsed ? t('common.expand') || 'Expand sidebar' : t('common.collapse') || 'Collapse sidebar'}
          title={isCollapsed ? t('common.expand') || 'Expand sidebar' : t('common.collapse') || 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                key="collapse-text"
                className="whitespace-nowrap"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
              >
                {t('common.collapse') || 'Collapse'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  )
}