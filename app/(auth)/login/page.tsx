'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LogIn } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <Card className="flex flex-col border shadow-sm lg:min-h-[460px]">
      <CardHeader className="space-y-1">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <LogIn className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.welcomeBack')}</CardTitle>
        <CardDescription>
          {t('auth.enterEmailAndPassword')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin} className="flex h-full flex-1 flex-col">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                router.push('/forgot-password')
              }}
              className="text-sm text-primary hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/signup" className="text-primary hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
