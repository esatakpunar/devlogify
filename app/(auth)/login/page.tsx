'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { LogIn } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
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
      router.push(redirectTo || '/dashboard')
      router.refresh()
    }
  }

  return (
    <AuthCard
      icon={<LogIn className="h-5 w-5 text-primary" />}
      title={t('auth.welcomeBack')}
      description={t('auth.enterEmailAndPassword')}
      onSubmit={handleLogin}
      error={error}
      loading={loading}
      submitDisabled={loading}
      submitLabel={t('auth.signIn')}
      loadingLabel={t('auth.signingIn')}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.dontHaveAccount')}{' '}
          <Link href="/signup" className="text-primary hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      )}
    >
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
      <PasswordInput
        id="password"
        label={t('auth.password')}
        value={password}
        onChange={setPassword}
        required
        disabled={loading}
      />
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
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
