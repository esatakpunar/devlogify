'use client'

import { useState } from 'react'
import { Menu, Search, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KeyboardHint } from '@/components/ui/KeyboardHint'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GlobalTimerIndicator } from '@/components/timer/GlobalTimerIndicator'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config'
import { toast } from 'sonner'

interface NavbarProps {
  user: {
    id: string
    email?: string
  }
  onMenuClick?: () => void
  onSearchClick?: () => void
}

export function Navbar({ user, onMenuClick, onSearchClick }: NavbarProps) {
  const t = useTranslation()
  const { locale, setLocale } = useLanguage()
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  
  const getInitials = (email?: string) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const handleLanguageChange = async (newLocale: Locale) => {
    try {
      await setLocale(newLocale)
      setIsLanguageOpen(false)
      toast.success(t('settings.languageUpdated'))
    } catch (error) {
      console.error('Failed to change language:', error)
      toast.error(t('settings.updateFailed'))
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 sm:px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 min-w-0 max-w-md group">
        <div className="relative">
          <Button
            variant="outline"
            type="button"
            onClick={onSearchClick}
            className="w-full h-8 sm:h-9 justify-start pl-7 sm:pl-8 pr-16 sm:pr-20 text-xs sm:text-sm font-normal text-muted-foreground"
          >
            <Search className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
            <span className="truncate">{t('common.searchPlaceholder')}</span>
          </Button>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
            <KeyboardHint shortcutId="search" size="sm" showOnHover />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
        {/* Global Timer Indicator */}
        <GlobalTimerIndicator userId={user.id} />

        {/* Theme Toggle */}
        <ThemeToggle userId={user.id} />

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) {
              setIsLanguageOpen(false)
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{t('common.myAccount')}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setIsLanguageOpen(!isLanguageOpen)
              }}
              className="cursor-pointer"
            >
              <span className="mr-2">{localeFlags[locale]}</span>
              <span className="flex-1">{t('settings.language')}</span>
              {isLanguageOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </DropdownMenuItem>
            {isLanguageOpen && (
              <>
                {locales.map((loc) => (
                  <DropdownMenuItem
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    className="cursor-pointer pl-8"
                  >
                    <span className="mr-2">{localeFlags[loc]}</span>
                    <span className="flex-1">{localeNames[loc]}</span>
                    {locale === loc && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">{t('common.settings')}</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action="/auth/signout" method="post" className="w-full">
                <button type="submit" className="w-full text-left text-red-600">
                  {t('common.signOut')}
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
