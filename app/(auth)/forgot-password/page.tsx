'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/AuthCard'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const t = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError(null)

    // Redirect to callback route which will handle code exchange and redirect to reset-password
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback?type=recovery`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=recovery`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setMessage(t('auth.passwordResetLinkSent'))
    }
  }

  return (
    <AuthCard
      icon={<Mail className="h-5 w-5 text-primary" />}
      title={t('auth.forgotPassword')}
      description={t('auth.enterEmailToResetPassword')}
      onSubmit={handleSubmit}
      error={error}
      success={message}
      loading={loading}
      submitDisabled={loading}
      submitLabel={t('auth.sendResetLink')}
      loadingLabel={t('auth.sending')}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.emailAddress')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          required
          disabled={loading}
        />
      </div>
    </AuthCard>
  )
}
