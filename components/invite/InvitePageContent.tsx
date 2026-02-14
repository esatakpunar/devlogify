'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Building2, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'

interface InvitationInfo {
  id: string
  email: string
  role: string
  companyName: string
  companyLogo: string | null
  inviterName: string
  expiresAt: string
}

interface InvitePageContentProps {
  token: string
  isAuthenticated: boolean
  userId: string | null
  userEmail: string | null
}

export function InvitePageContent({ token, isAuthenticated, userId, userEmail }: InvitePageContentProps) {
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'accepted' | 'not_found' | 'error'>('loading')
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    async function verifyInvitation() {
      try {
        const res = await fetch('/api/invitations/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (!res.ok) {
          if (data.status === 'accepted') {
            setStatus('accepted')
          } else if (data.status === 'expired') {
            setStatus('expired')
          } else {
            setStatus('not_found')
          }
          return
        }

        setInvitation(data.invitation)
        setStatus('valid')
      } catch {
        setStatus('error')
      }
    }

    verifyInvitation()
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    setAcceptError(null)

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAcceptError(data.error || 'Failed to accept invitation')
        return
      }

      setAccepted(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch {
      setAcceptError('An unexpected error occurred')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-gray-500">Verifying invitation...</p>
            </div>
          )}

          {/* Not Found */}
          {status === 'not_found' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <XCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold">Invitation Not Found</h2>
              <p className="text-sm text-gray-500">
                This invitation link is invalid or has been revoked.
              </p>
              <Link href="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </div>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <XCircle className="w-12 h-12 text-amber-500" />
              <h2 className="text-xl font-semibold">Invitation Expired</h2>
              <p className="text-sm text-gray-500">
                This invitation has expired. Please ask the admin to send a new invitation.
              </p>
              <Link href="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </div>
          )}

          {/* Already Accepted */}
          {status === 'accepted' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h2 className="text-xl font-semibold">Already Accepted</h2>
              <p className="text-sm text-gray-500">
                This invitation has already been accepted.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <XCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-sm text-gray-500">
                Please try again later.
              </p>
            </div>
          )}

          {/* Valid invitation - success after accept */}
          {status === 'valid' && accepted && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h2 className="text-xl font-semibold">Welcome!</h2>
              <p className="text-sm text-gray-500">
                You've joined <strong>{invitation?.companyName}</strong>. Redirecting to dashboard...
              </p>
            </div>
          )}

          {/* Valid invitation - show details */}
          {status === 'valid' && invitation && !accepted && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold">You're invited!</h2>
                <p className="text-sm text-gray-500">
                  <strong>{invitation.inviterName}</strong> invited you to join
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium">{invitation.companyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium capitalize">{invitation.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invited as</span>
                  <span className="font-medium">{invitation.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires</span>
                  <span className="font-medium">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {acceptError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{acceptError}</p>
                </div>
              )}

              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-xs text-center text-gray-500">
                    Signed in as <strong>{userEmail}</strong>
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Accept Invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-gray-500">
                    You need to sign in or create an account to accept this invitation.
                  </p>
                  <div className="flex gap-3">
                    <Link href={`/login?redirect=/invite/${token}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href={`/signup?redirect=/invite/${token}`} className="flex-1">
                      <Button className="w-full">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
