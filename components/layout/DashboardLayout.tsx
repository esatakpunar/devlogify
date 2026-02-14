'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { ShortcutsHelp } from '@/components/ui/ShortcutsHelp'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'
import { LanguageProvider } from '@/components/providers/LanguageProvider'
import { LanguageHtml } from '@/components/providers/LanguageHtml'
import { useUserProfileStore } from '@/lib/store/userProfileStore'
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
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { fetchProfile, clearProfile } = useUserProfileStore()

  // Don't use dashboard layout for auth pages, landing page, and share pages
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/forgot-password') || 
                     pathname?.startsWith('/reset-password')
  const isOnboardingPage = pathname?.startsWith('/onboarding')
  const isLandingPage = pathname === '/'
  const isSharePage = pathname?.startsWith('/share/')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && !isAuthPage && !isOnboardingPage && !isLandingPage && !isSharePage) {
        clearProfile()
        router.push('/login')
      } else {
        setUser(user)
        // Fetch profile once when user is logged in
        if (user?.id) {
          fetchProfile(user.id)
        }
      }
    }
    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearProfile()
        setUser(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        if (session.user.id) {
          fetchProfile(session.user.id)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase.auth, isAuthPage, isOnboardingPage, isLandingPage, isSharePage])

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
    onSearch: () => {
      // Open global search
      setGlobalSearchOpen(true)
    },
    userId: user?.id,
  })

  // Auth sayfaları, landing page ve share sayfaları için LanguageProvider ile birlikte render et
  if (isAuthPage || isOnboardingPage || isLandingPage || isSharePage) {
    return (
      <LanguageProvider userId={undefined}>
        <LanguageHtml />
        {children}
      </LanguageProvider>
    )
  }

  if (!user) {
    return (
      <LanguageProvider userId={undefined}>
        <LanguageHtml />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </LanguageProvider>
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
          <Navbar
            user={user}
            onMenuClick={() => setMobileMenuOpen(true)}
            onSearchClick={() => setGlobalSearchOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      <Toaster position="top-right" />
      
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

      {/* Global Search */}
      {user && (
        <GlobalSearch
          open={globalSearchOpen}
          onOpenChange={setGlobalSearchOpen}
          userId={user.id}
        />
      )}
    </LanguageProvider>
  )
}
