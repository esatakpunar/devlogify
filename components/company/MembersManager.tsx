'use client'

import { useState, useCallback } from 'react'
import { useCompanyStore } from '@/lib/store/companyStore'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { updateMemberRole, removeMember } from '@/lib/supabase/queries/companies'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { UserMinus, Shield, Loader2, Crown } from 'lucide-react'
import type { CompanyMemberWithProfile } from '@/types/supabase'

interface MembersManagerProps {
  companyId: string
  userId: string
  isAdmin: boolean
}

export function MembersManager({ companyId, userId, isAdmin }: MembersManagerProps) {
  const t = useTranslation()
  const { members, company, fetchMembers } = useCompanyStore()

  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<CompanyMemberWithProfile | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const handleRoleChange = useCallback(async (memberId: string, newRole: 'admin' | 'member') => {
    setUpdatingRoleId(memberId)
    try {
      await updateMemberRole(memberId, newRole)
      await fetchMembers(companyId)
      toast.success(t('company.roleUpdated'))
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error(t('company.roleUpdateError'))
    } finally {
      setUpdatingRoleId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, fetchMembers])

  const handleRemoveMember = async () => {
    if (!removingMember) return

    setIsRemoving(true)
    try {
      await removeMember(companyId, removingMember.user_id)
      await fetchMembers(companyId)
      toast.success(t('company.memberRemoved'))
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(t('company.memberRemoveError'))
    } finally {
      setIsRemoving(false)
      setRemovingMember(null)
    }
  }

  const isOwner = (memberUserId: string) => company?.owner_id === memberUserId

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>{t('company.noMembers')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('company.membersCount', { count: members.length })}
      </p>

      <div className="space-y-0">
        {members.map((member, index) => (
          <div key={member.id}>
            <div className="flex items-center gap-4 py-3">
              {/* Avatar */}
              <Avatar className="w-10 h-10">
                {member.profile.avatar_url ? (
                  <AvatarImage src={member.profile.avatar_url} alt={member.profile.full_name || ''} />
                ) : null}
                <AvatarFallback className="text-sm font-medium">
                  {getInitials(member.profile.full_name, member.profile.email)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {member.profile.full_name || member.profile.email}
                  </p>
                  {isOwner(member.user_id) && (
                    <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {member.profile.email}
                </p>
              </div>

              {/* Role Badge / Select */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && !isOwner(member.user_id) && member.user_id !== userId ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'member')}
                    disabled={updatingRoleId === member.id}
                  >
                    <SelectTrigger className="w-[120px]" size="sm">
                      {updatingRoleId === member.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          {t('company.roleAdmin')}
                        </div>
                      </SelectItem>
                      <SelectItem value="member">{t('company.roleMember')}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' ? t('company.roleAdmin') : t('company.roleMember')}
                  </Badge>
                )}

                {/* Remove button */}
                {isAdmin && !isOwner(member.user_id) && member.user_id !== userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemovingMember(member)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title={t('company.removeMember')}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {index < members.length - 1 && <Separator />}
          </div>
        ))}
      </div>

      {/* Remove Member Confirm */}
      <ConfirmModal
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        title={t('company.removeMemberTitle')}
        description={t('company.removeMemberDescription', {
          name: removingMember?.profile.full_name || removingMember?.profile.email || '',
        })}
        confirmText={t('company.removeMember')}
        variant="destructive"
        onConfirm={handleRemoveMember}
        loading={isRemoving}
      />
    </div>
  )
}
