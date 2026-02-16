'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  Clock,
  BarChart3,
  StickyNote,
  Settings,
  ChevronLeft,
  Building2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useSidebarCollapse } from '@/lib/hooks/useSidebarCollapse'
import { useCompanyStore } from '@/lib/store/companyStore'
import { useUserProfileStore } from '@/lib/store/userProfileStore'

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects', href: '/projects', icon: FolderKanban },
  { key: 'kanban', href: '/kanban', icon: KanbanSquare },
  { key: 'timeline', href: '/timeline', icon: Clock },
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'notes', href: '/notes', icon: StickyNote },
  { key: 'company', href: '/company', icon: Building2 },
]

interface SidebarProps {
  onLinkClick?: () => void
}

// Animation constants for consistent timing
const SIDEBAR_TRANSITION = {
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number], // Smooth cubic bezier
}

const TEXT_TRANSITION = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
}

export function Sidebar({ onLinkClick }: SidebarProps = {}) {
  const pathname = usePathname()
  const t = useTranslation()
  const { isCollapsed, toggleCollapse } = useSidebarCollapse()

  return (
    <motion.aside
      className="relative flex h-full flex-col bg-white border-r border-gray-200 overflow-hidden will-change-[width]"
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 256,
      }}
      transition={SIDEBAR_TRANSITION}
      style={{
        minWidth: isCollapsed ? 64 : 256,
        maxWidth: isCollapsed ? 64 : 256,
      }}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-gray-200 shrink-0 transition-all",
        isCollapsed ? "justify-center px-0" : "px-6"
      )}>
        <Link 
          href="/dashboard" 
          onClick={onLinkClick} 
          className={cn(
            "flex items-center transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isCollapsed ? "justify-center w-full" : "space-x-2 w-full"
          )}
        >
          <Image 
            src="/favicon.ico" 
            alt="Devlogify" 
            width={32} 
            height={32} 
            className="w-8 h-8 shrink-0 transition-transform duration-300"
          />
          <AnimatePresence mode="wait" initial={false}>
            {!isCollapsed && (
              <motion.span
                key="logo-text"
                className="text-xl font-bold whitespace-nowrap overflow-hidden"
                initial={{ opacity: 0, maxWidth: 0, marginLeft: 0 }}
                animate={{ 
                  opacity: 1, 
                  maxWidth: 200,
                  marginLeft: 8,
                }}
                exit={{ 
                  opacity: 0, 
                  maxWidth: 0,
                  marginLeft: 0,
                }}
                transition={TEXT_TRANSITION}
              >
                Devlogify
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors group relative overflow-hidden',
                isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0 transition-transform duration-300" />
              <AnimatePresence mode="wait" initial={false}>
                {!isCollapsed && (
                  <motion.span
                    key={`nav-${item.key}`}
                    className="whitespace-nowrap overflow-hidden"
                    initial={{ opacity: 0, maxWidth: 0 }}
                    animate={{ opacity: 1, maxWidth: 200 }}
                    exit={{ opacity: 0, maxWidth: 0 }}
                    transition={TEXT_TRANSITION}
                  >
                    {t(`nav.${item.key}`)}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <motion.div
                  className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap z-50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {t(`nav.${item.key}`)}
                </motion.div>
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
            'flex items-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors group relative overflow-hidden',
            isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2'
          )}
        >
          <Settings className="w-5 h-5 shrink-0 transition-transform duration-300" />
          <AnimatePresence mode="wait" initial={false}>
            {!isCollapsed && (
              <motion.span
                key="settings-text"
                className="whitespace-nowrap overflow-hidden"
                initial={{ opacity: 0, maxWidth: 0 }}
                animate={{ opacity: 1, maxWidth: 200 }}
                exit={{ opacity: 0, maxWidth: 0 }}
                transition={TEXT_TRANSITION}
              >
                {t('common.settings')}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <motion.div
              className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap z-50"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {t('common.settings')}
            </motion.div>
          )}
        </Link>
        
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'flex items-center w-full rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors overflow-hidden',
            isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2'
          )}
          aria-label={isCollapsed ? t('common.expand') || 'Expand sidebar' : t('common.collapse') || 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
          <AnimatePresence mode="wait" initial={false}>
            {!isCollapsed && (
              <motion.span
                key="collapse-text"
                className="whitespace-nowrap overflow-hidden"
                initial={{ opacity: 0, maxWidth: 0 }}
                animate={{ opacity: 1, maxWidth: 200 }}
                exit={{ opacity: 0, maxWidth: 0 }}
                transition={TEXT_TRANSITION}
              >
                {t('common.collapse') || 'Collapse'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
