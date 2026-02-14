'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { KeyRound } from 'lucide-react'
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
    <AuthCard
      icon={<KeyRound className="h-5 w-5 text-primary" />}
      title={t('auth.resetPasswordTitle')}
      description={t('auth.enterNewPassword')}
      onSubmit={handleSubmit}
      error={error && !passwordResetSuccess ? error : null}
      success={message}
      loading={loading}
      submitDisabled={loading}
      submitLabel={t('auth.updatePassword')}
      loadingLabel={t('auth.updatingPassword')}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      )}
    >
      <PasswordInput
        id="password"
        label={t('auth.newPassword')}
        placeholder={t('auth.newPasswordPlaceholder')}
        value={password}
        onChange={setPassword}
        required
        disabled={loading}
        minLength={6}
      />
      <PasswordInput
        id="confirm-password"
        label={t('auth.confirmPassword')}
        placeholder={t('auth.confirmPasswordPlaceholder')}
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        disabled={loading}
        minLength={6}
      />
    </AuthCard>
  )
}
