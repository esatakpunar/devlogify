'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createCompany, joinByCode } from '@/lib/supabase/queries/companies'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface OnboardingContentProps {
  userId: string
  userEmail: string
}

export function OnboardingContent({ userId, userEmail }: OnboardingContentProps) {
  const router = useRouter()
  const t = useTranslation()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    setLoading(true)
    try {
      await createCompany(companyName.trim(), userId)
      toast.success(t('onboarding.companyCreated'))
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || t('onboarding.failedToCreateCompany'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    try {
      await joinByCode(joinCode.trim(), userId)
      toast.success(t('onboarding.joinedCompany'))
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || t('onboarding.failedToJoinCompany'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="hidden rounded-2xl border bg-card/60 p-8 lg:block">
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('onboarding.welcome')}</h1>
            <p className="mt-3 text-muted-foreground">{t('onboarding.getStarted')}</p>
            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg border bg-background/70 px-4 py-3">
                {t('onboarding.createCompanyDescription')}
              </div>
              <div className="rounded-lg border bg-background/70 px-4 py-3">
                {t('onboarding.joinCompanyDescription')}
              </div>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              {userEmail}
            </p>
          </div>

          <Card className="w-full border shadow-sm">
            <CardHeader className="space-y-4">
              <div className="space-y-1 lg:hidden">
                <CardTitle className="text-2xl">{t('onboarding.welcome')}</CardTitle>
                <CardDescription>{t('onboarding.getStarted')}</CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                <Button
                  type="button"
                  variant={mode === 'create' ? 'default' : 'ghost'}
                  className="h-10"
                  onClick={() => setMode('create')}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('onboarding.createNew')}
                </Button>
                <Button
                  type="button"
                  variant={mode === 'join' ? 'default' : 'ghost'}
                  className="h-10"
                  onClick={() => setMode('join')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('onboarding.joinExisting')}
                </Button>
              </div>
              <div>
                <CardTitle>{mode === 'create' ? t('onboarding.createCompany') : t('onboarding.joinCompany')}</CardTitle>
                <CardDescription>
                  {mode === 'create'
                    ? t('onboarding.createCompanyFormDescription')
                    : t('onboarding.joinCompanyFormDescription')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {mode === 'create' ? (
                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t('onboarding.companyName')}</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('onboarding.companyNamePlaceholder')}
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !companyName.trim()} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('onboarding.createCompany')}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleJoinCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">{t('onboarding.joinCode')}</Label>
                    <Input
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder={t('onboarding.joinCodePlaceholder')}
                      required
                      autoFocus
                      maxLength={8}
                      disabled={loading}
                      className="text-center text-lg tracking-[0.3em] font-mono"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !joinCode.trim()} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('onboarding.joinCompany')}
                  </Button>
                </form>
              )}
              <p className="mt-4 text-center text-xs text-muted-foreground lg:hidden">
                {userEmail}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
