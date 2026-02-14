'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()
  
  // Use refs to access latest state values in event handler without causing re-renders
  const passwordResetSuccessRef = useRef(false)
  const hasRecoverySessionRef = useRef(false)

  // Token check - Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    // Check session on initial load
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setHasRecoverySession(true)
        hasRecoverySessionRef.current = true
      }
    }
    checkInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User came from email, can reset password
        setHasRecoverySession(true)
        hasRecoverySessionRef.current = true
        setError('')
      } else if (event === 'SIGNED_OUT' || !session) {
        // If no session or signed out
        // But don't show error if password was successfully updated
        if (!session && !passwordResetSuccessRef.current && !hasRecoverySessionRef.current) {
          setError(t('auth.invalidOrExpiredLink'))
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, t])
  
  // Keep refs in sync with state
  useEffect(() => {
    passwordResetSuccessRef.current = passwordResetSuccess
  }, [passwordResetSuccess])
  
  useEffect(() => {
    hasRecoverySessionRef.current = hasRecoverySession
  }, [hasRecoverySession])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // Password validation
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    setLoading(false)

    if (updateError) {
      setError(t('auth.passwordUpdateFailed') + ': ' + updateError.message)
    } else {
      // Set successful update flag
      setPasswordResetSuccess(true)
      setMessage(t('auth.passwordUpdatedSuccess'))
      setError('') // Clear error message
      
      // Clear session after password update and redirect to login
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <Card className="flex flex-col border shadow-sm lg:min-h-[460px]">
      <CardHeader className="space-y-1">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.resetPasswordTitle')}</CardTitle>
        <CardDescription>
          {t('auth.enterNewPassword')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col">
        <CardContent className="flex-1 space-y-4 pb-6">
          {error && !passwordResetSuccess && (
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
            <Label htmlFor="password">{t('auth.newPassword')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.newPasswordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t('auth.updatingPassword') : t('auth.updatePassword')}
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
