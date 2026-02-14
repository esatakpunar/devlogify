'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { Loader2, Mail } from 'lucide-react'

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
    <Card className="flex flex-col border shadow-sm lg:min-h-[460px]">
      <CardHeader className="space-y-1">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword')}</CardTitle>
        <CardDescription>
          {t('auth.enterEmailToResetPassword')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col">
        <CardContent className="flex-1 space-y-4 pb-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
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
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t('auth.sending') : t('auth.sendResetLink')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
