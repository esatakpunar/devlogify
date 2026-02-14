'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Loader2, UserPlus } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="flex flex-col border shadow-sm lg:min-h-[460px]">
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <CardTitle>{t('auth.checkYourEmail')}</CardTitle>
          <CardDescription>
            {t('auth.confirmationLinkSent', { email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('auth.clickLinkToVerify')}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
            {t('auth.backToLogin')}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col border shadow-sm lg:min-h-[460px]">
      <CardHeader className="space-y-1">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.createAccount')}</CardTitle>
        <CardDescription>
          {t('auth.enterEmailAndPasswordToGetStarted')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup} className="flex h-full flex-1 flex-col">
        <CardContent className="flex-1 space-y-4 pb-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t('auth.creatingAccount') : t('auth.signUp')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
