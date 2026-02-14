'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'
import { CheckCircle2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslation()
  const pathname = usePathname()

  const panelByRoute = {
    '/login': {
      title: t('auth.authPanelLoginTitle'),
      subtitle: t('auth.authPanelLoginSubtitle'),
    },
    '/signup': {
      title: t('auth.authPanelSignupTitle'),
      subtitle: t('auth.authPanelSignupSubtitle'),
    },
    '/forgot-password': {
      title: t('auth.authPanelForgotTitle'),
      subtitle: t('auth.authPanelForgotSubtitle'),
    },
    '/reset-password': {
      title: t('auth.authPanelResetTitle'),
      subtitle: t('auth.authPanelResetSubtitle'),
    },
  } as const

  const panel = panelByRoute[pathname as keyof typeof panelByRoute] ?? {
    title: t('auth.authPanelTitle'),
    subtitle: t('auth.authPanelSubtitle'),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-2">
          <div className="hidden min-h-[460px] rounded-2xl border bg-card/60 p-8 lg:block">
            <h1 className="text-3xl font-bold tracking-tight">{panel.title}</h1>
            <p className="mt-3 text-muted-foreground">{panel.subtitle}</p>
            <div className="mt-10 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{t('auth.authPanelPointWork')}</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{t('auth.authPanelPointTeam')}</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{t('auth.authPanelPointInsight')}</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {t('auth.authPanelFooter')}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
