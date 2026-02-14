'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, ArrowRight, Loader2 } from 'lucide-react'
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
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [loading, setLoading] = useState(false)

  // Create company form
  const [companyName, setCompanyName] = useState('')

  // Join company form
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

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('onboarding.welcome')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('onboarding.getStarted')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setMode('create')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  {t('onboarding.createCompany')}
                </CardTitle>
                <CardDescription>
                  {t('onboarding.createCompanyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" size="sm">
                  {t('onboarding.createNew')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setMode('join')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  {t('onboarding.joinCompany')}
                </CardTitle>
                <CardDescription>
                  {t('onboarding.joinCompanyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" size="sm">
                  {t('onboarding.joinExisting')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('onboarding.createCompany')}</CardTitle>
            <CardDescription>
              {t('onboarding.createCompanyFormDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('select')}
                  disabled={loading}
                >
                  {t('common.back')}
                </Button>
                <Button type="submit" disabled={loading || !companyName.trim()} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('onboarding.createCompany')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // mode === 'join'
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('onboarding.joinCompany')}</CardTitle>
          <CardDescription>
            {t('onboarding.joinCompanyFormDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joinCode">{t('onboarding.joinCode')}</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t('onboarding.joinCodePlaceholder')}
                required
                autoFocus
                maxLength={8}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode('select')}
                disabled={loading}
              >
                {t('common.back')}
              </Button>
              <Button type="submit" disabled={loading || !joinCode.trim()} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('onboarding.joinCompany')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
