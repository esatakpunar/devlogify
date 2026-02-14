'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import {
  createInvitation,
  getInvitations,
  cancelInvitation,
} from '@/lib/supabase/queries/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { toast } from 'sonner'
import {
  Send,
  X,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import type { Invitation, Profile } from '@/types/supabase'

interface InvitationsManagerProps {
  companyId: string
  userId: string
  isAdmin: boolean
}

type InvitationWithInviter = Invitation & {
  invited_by_profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}

export function InvitationsManager({ companyId, userId, isAdmin }: InvitationsManagerProps) {
  const t = useTranslation()

  const [invitations, setInvitations] = useState<InvitationWithInviter[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isSending, setIsSending] = useState(false)

  // Cancel state
  const [cancellingInvitation, setCancellingInvitation] = useState<InvitationWithInviter | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const loadInvitations = useCallback(async () => {
    try {
      const data = await getInvitations(companyId)
      setInvitations(data as InvitationWithInviter[])
    } catch (error) {
      console.error('Error loading invitations:', error)
      toast.error('Failed to load invitations')
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast.error(t('company.emailRequired'))
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error(t('company.invalidEmail'))
      return
    }

    // Check for duplicate pending invitation
    const existing = invitations.find(
      (inv) => inv.email === email.trim() && inv.status === 'pending'
    )
    if (existing) {
      toast.error(t('company.duplicateInvitation'))
      return
    }

    setIsSending(true)
    try {
      await createInvitation(companyId, email.trim(), role, userId)
      await loadInvitations()
      setEmail('')
      setRole('member')
      toast.success(t('company.invitationSent'))
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error(t('company.invitationSendError'))
    } finally {
      setIsSending(false)
    }
  }

  const handleCancelInvitation = async () => {
    if (!cancellingInvitation) return

    setIsCancelling(true)
    try {
      await cancelInvitation(cancellingInvitation.id)
      await loadInvitations()
      toast.success(t('company.invitationCancelled'))
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error(t('company.invitationCancelError'))
    } finally {
      setIsCancelling(false)
      setCancellingInvitation(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />
      case 'accepted':
        return <CheckCircle className="w-3.5 h-3.5" />
      case 'expired':
        return <XCircle className="w-3.5 h-3.5" />
      default:
        return null
    }
  }

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'accepted':
        return 'default'
      case 'expired':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending')
  const pastInvitations = invitations.filter((inv) => inv.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Send Invitation Form */}
      {isAdmin && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold">{t('company.sendInvitation')}</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">{t('company.emailLabel')}</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('company.emailPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendInvitation()
                }}
              />
            </div>
            <div className="w-full sm:w-[140px] space-y-1.5">
              <Label>{t('company.roleLabel')}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t('company.roleMember')}</SelectItem>
                  <SelectItem value="admin">{t('company.roleAdmin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSendInvitation} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {t('company.sendInvite')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('company.pendingInvitations')} ({pendingInvitations.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : pendingInvitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('company.noPendingInvitations')}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {pendingInvitations.map((inv, index) => (
              <div key={inv.id}>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <Badge variant={getStatusVariant(inv.status)} className="gap-1">
                        {getStatusIcon(inv.status)}
                        {t(`company.status_${inv.status}`)}
                      </Badge>
                      <Badge variant="secondary">
                        {inv.role === 'admin' ? t('company.roleAdmin') : t('company.roleMember')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('company.invitedOn', { date: formatDate(inv.created_at) })}
                      {inv.invited_by_profile && (
                        <> &middot; {t('company.invitedBy', { name: inv.invited_by_profile.full_name || inv.invited_by_profile.email })}</>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t('company.expiresOn', { date: formatDate(inv.expires_at) })}
                    </p>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCancellingInvitation(inv)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                      title={t('company.cancelInvitation')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {index < pendingInvitations.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Invitations */}
      {pastInvitations.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('company.pastInvitations')} ({pastInvitations.length})
          </h3>
          <div className="space-y-0">
            {pastInvitations.map((inv, index) => (
              <div key={inv.id}>
                <div className="flex items-center gap-4 py-3 opacity-60">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <Badge variant={getStatusVariant(inv.status)} className="gap-1">
                        {getStatusIcon(inv.status)}
                        {t(`company.status_${inv.status}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatDate(inv.created_at)}
                    </p>
                  </div>
                </div>
                {index < pastInvitations.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Invitation Confirm */}
      <ConfirmModal
        open={!!cancellingInvitation}
        onOpenChange={(open) => !open && setCancellingInvitation(null)}
        title={t('company.cancelInvitationTitle')}
        description={t('company.cancelInvitationDescription', {
          email: cancellingInvitation?.email || '',
        })}
        confirmText={t('company.cancelInvitation')}
        variant="destructive"
        onConfirm={handleCancelInvitation}
        loading={isCancelling}
      />
    </div>
  )
}
