'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { UserPlus } from 'lucide-react'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
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
        emailRedirectTo: `${location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
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
      <AuthCard
        icon={<UserPlus className="h-5 w-5 text-green-700" />}
        iconContainerClassName="bg-green-100"
        title={t('auth.checkYourEmail')}
        description={t('auth.confirmationLinkSent', { email })}
        submitType="button"
        submitVariant="outline"
        submitLabel={t('auth.backToLogin')}
        onSubmitClick={() => router.push('/login')}
      >
          <p className="text-sm text-muted-foreground">
            {t('auth.clickLinkToVerify')}
          </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={<UserPlus className="h-5 w-5 text-primary" />}
      title={t('auth.createAccount')}
      description={t('auth.enterEmailAndPasswordToGetStarted')}
      onSubmit={handleSignup}
      error={error}
      loading={loading}
      submitDisabled={loading}
      submitLabel={t('auth.signUp')}
      loadingLabel={t('auth.creatingAccount')}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('auth.signIn')}
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
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChange={setPassword}
        required
        minLength={6}
        disabled={loading}
      />
    </AuthCard>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
