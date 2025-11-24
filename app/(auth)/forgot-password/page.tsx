'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/useTranslation'

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
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword')}</CardTitle>
        <CardDescription>
          {t('auth.enterEmailToResetPassword')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pb-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
              {message}
            </div>
          )}
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.sending') : t('auth.sendResetLink')}
          </Button>
          <p className="text-sm text-center text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

