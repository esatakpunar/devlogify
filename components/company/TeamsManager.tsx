'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCompanyStore } from '@/lib/store/companyStore'
import { useTranslation } from '@/lib/i18n/useTranslation'
import {
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
} from '@/lib/supabase/queries/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Loader2,
} from 'lucide-react'
import type { Team, TeamMemberWithProfile, CompanyMemberWithProfile } from '@/types/supabase'

interface TeamsManagerProps {
  companyId: string
  userId: string
  isAdmin: boolean
}

interface TeamWithCount extends Team {
  team_members: { count: number }[]
}

export function TeamsManager({ companyId, userId, isAdmin }: TeamsManagerProps) {
  const t = useTranslation()
  const { teams, members, fetchTeams } = useCompanyStore()

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createColor, setCreateColor] = useState('#6366f1')
  const [isCreating, setIsCreating] = useState(false)

  // Edit dialog
  const [editingTeam, setEditingTeam] = useState<TeamWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Members dialog
  const [managingTeam, setManagingTeam] = useState<TeamWithCount | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  // Delete confirm
  const [deletingTeam, setDeletingTeam] = useState<TeamWithCount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#64748b',
  ]

  const loadTeamMembers = useCallback(async (teamId: string) => {
    setIsLoadingMembers(true)
    try {
      const data = await getTeamMembers(teamId)
      setTeamMembers(data)
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  useEffect(() => {
    if (managingTeam) {
      loadTeamMembers(managingTeam.id)
    }
  }, [managingTeam, loadTeamMembers])

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

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error(t('company.teamNameRequired'))
      return
    }

    setIsCreating(true)
    try {
      await createTeam(companyId, createName.trim(), userId, createDescription.trim() || undefined, createColor)
      await fetchTeams(companyId)
      setShowCreateDialog(false)
      setCreateName('')
      setCreateDescription('')
      setCreateColor('#6366f1')
      toast.success(t('company.teamCreated'))
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error(t('company.teamCreateError'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenEdit = (team: TeamWithCount) => {
    setEditingTeam(team)
    setEditName(team.name)
    setEditDescription(team.description || '')
    setEditColor(team.color)
  }

  const handleSaveEdit = async () => {
    if (!editingTeam || !editName.trim()) {
      toast.error(t('company.teamNameRequired'))
      return
    }

    setIsSavingEdit(true)
    try {
      await updateTeam(editingTeam.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        color: editColor,
      })
      await fetchTeams(companyId)
      setEditingTeam(null)
      toast.success(t('company.teamUpdated'))
    } catch (error) {
      console.error('Error updating team:', error)
      toast.error(t('company.teamUpdateError'))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTeam) return

    setIsDeleting(true)
    try {
      await deleteTeam(deletingTeam.id)
      await fetchTeams(companyId)
      toast.success(t('company.teamDeleted'))
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error(t('company.teamDeleteError'))
    } finally {
      setIsDeleting(false)
      setDeletingTeam(null)
    }
  }

  const handleAddMember = async () => {
    if (!managingTeam || !selectedMemberToAdd) return

    setIsAddingMember(true)
    try {
      await addTeamMember(managingTeam.id, selectedMemberToAdd)
      await loadTeamMembers(managingTeam.id)
      await fetchTeams(companyId)
      setSelectedMemberToAdd('')
      toast.success(t('company.teamMemberAdded'))
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error(t('company.teamMemberAddError'))
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveTeamMember = async (memberUserId: string) => {
    if (!managingTeam) return

    setRemovingMemberId(memberUserId)
    try {
      await removeTeamMember(managingTeam.id, memberUserId)
      await loadTeamMembers(managingTeam.id)
      await fetchTeams(companyId)
      toast.success(t('company.teamMemberRemoved'))
    } catch (error) {
      console.error('Error removing team member:', error)
      toast.error(t('company.teamMemberRemoveError'))
    } finally {
      setRemovingMemberId(null)
    }
  }

  // Members not yet in the team
  const availableMembers = members.filter(
    (m) => !teamMembers.some((tm) => tm.user_id === m.user_id)
  )

  const typedTeams = teams as TeamWithCount[]

  return (
    <div className="space-y-4">
      {/* Create Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('company.createTeam')}
          </Button>
        </div>
      )}

      {/* Teams List */}
      {typedTeams.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('company.noTeams')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {typedTeams.map((team) => {
            const memberCount = team.team_members?.[0]?.count ?? 0
            return (
              <div
                key={team.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{team.name}</h3>
                      {team.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Users className="w-3 h-3 mr-1" />
                    {memberCount}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManagingTeam(team)}
                    className="text-xs"
                  >
                    <Users className="w-3 h-3 mr-1.5" />
                    {t('company.manageMembers')}
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(team)}
                        className="text-xs"
                      >
                        <Pencil className="w-3 h-3 mr-1.5" />
                        {t('company.editTeam')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTeam(team)}
                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3 mr-1.5" />
                        {t('company.deleteTeam')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('company.createTeam')}</DialogTitle>
            <DialogDescription>{t('company.createTeamDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">{t('company.teamNameLabel')}</Label>
              <Input
                id="team-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('company.teamNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">{t('company.teamDescriptionLabel')}</Label>
              <Textarea
                id="team-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder={t('company.teamDescriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company.teamColorLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCreateColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      createColor === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('company.createTeam')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('company.editTeam')}</DialogTitle>
            <DialogDescription>{t('company.editTeamDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">{t('company.teamNameLabel')}</Label>
              <Input
                id="edit-team-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('company.teamNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">{t('company.teamDescriptionLabel')}</Label>
              <Textarea
                id="edit-team-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t('company.teamDescriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company.teamColorLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editColor === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('company.saveTeam')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Team Members Dialog */}
      <Dialog open={!!managingTeam} onOpenChange={(open) => !open && setManagingTeam(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {managingTeam?.name} - {t('company.teamMembers')}
            </DialogTitle>
            <DialogDescription>{t('company.manageTeamMembersDescription')}</DialogDescription>
          </DialogHeader>

          {/* Add Member */}
          {isAdmin && availableMembers.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>{t('company.addTeamMember')}</Label>
                <Select value={selectedMemberToAdd} onValueChange={setSelectedMemberToAdd}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('company.selectMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile.full_name || m.profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} disabled={!selectedMemberToAdd || isAddingMember} size="sm">
                {isAddingMember ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}

          <Separator />

          {/* Team Members List */}
          <div className="max-h-[300px] overflow-y-auto space-y-0">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                {t('company.noTeamMembers')}
              </p>
            ) : (
              teamMembers.map((tm, index) => (
                <div key={tm.id}>
                  <div className="flex items-center gap-3 py-2.5">
                    <Avatar className="w-8 h-8">
                      {tm.profile.avatar_url ? (
                        <AvatarImage src={tm.profile.avatar_url} alt={tm.profile.full_name || ''} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {getInitials(tm.profile.full_name, tm.profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tm.profile.full_name || tm.profile.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {tm.profile.email}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTeamMember(tm.user_id)}
                        disabled={removingMemberId === tm.user_id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                      >
                        {removingMemberId === tm.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  {index < teamMembers.length - 1 && <Separator />}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirm */}
      <ConfirmModal
        open={!!deletingTeam}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
        title={t('company.deleteTeamTitle')}
        description={t('company.deleteTeamDescription', {
          name: deletingTeam?.name || '',
        })}
        confirmText={t('company.deleteTeam')}
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  )
}
