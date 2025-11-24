'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ShortcutsHelp } from '@/components/ui/ShortcutsHelp'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import { LanguageProvider } from '@/components/providers/LanguageProvider'
import { LanguageHtml } from '@/components/providers/LanguageHtml'
import { Toaster } from 'sonner'

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Don't use dashboard layout for auth pages and landing page
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/forgot-password') || 
                     pathname?.startsWith('/reset-password')
  const isLandingPage = pathname === '/'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && !isAuthPage && !isLandingPage) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [router, supabase.auth, isAuthPage, isLandingPage])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateTask: () => {
      // Navigate to projects page where user can create task
      router.push('/projects')
    },
    onCreateNote: () => {
      router.push('/notes')
    },
    onCreateProject: () => {
      router.push('/projects')
    },
    onShowShortcuts: () => {
      setShortcutsHelpOpen(true)
    },
    onOpenCommandPalette: () => {
      setCommandPaletteOpen(true)
    },
    userId: user?.id,
  })

  // Auth sayfaları ve landing page için LanguageProvider ile birlikte render et
  if (isAuthPage || isLandingPage) {
    return (
      <LanguageProvider userId={undefined}>
        <LanguageHtml />
        {children}
      </LanguageProvider>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <LanguageProvider userId={user?.id}>
      <LanguageHtml />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar user={user} onMenuClick={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" />
      
      {/* Command Palette */}
      {user && (
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          userId={user.id}
        />
      )}

      {/* Shortcuts Help */}
      <ShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </LanguageProvider>
  )
}
