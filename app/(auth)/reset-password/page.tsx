'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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
          setError('Invalid or expired link. Please request a new password reset link.')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])
  
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
      setError('Passwords do not match!')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters!')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    setLoading(false)

    if (updateError) {
      setError('An error occurred while updating password: ' + updateError.message)
    } else {
      // Set successful update flag
      setPasswordResetSuccess(true)
      setMessage('Your password has been successfully updated!')
      setError('') // Clear error message
      
      // Clear session after password update and redirect to login
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pb-6">
          {error && !passwordResetSuccess && (
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
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
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
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
          <p className="text-sm text-center text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

