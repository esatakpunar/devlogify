'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { toast } from 'sonner'
import {
  closeSprintAndCarryOver,
  createMonthlySprint,
  getSprints,
  updateSprint,
  type Sprint,
} from '@/lib/supabase/queries/sprints'
import { logActivity } from '@/lib/supabase/queries/activities'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'

interface SprintsManagerProps {
  companyId: string
  userId: string
  isAdmin: boolean
}

function getDefaultMonthValue() {
  return new Date().toISOString().slice(0, 7)
}

function getSprintNameFromMonth(monthValue: string) {
  const [yearStr, monthStr] = monthValue.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (!year || !month) {
    return monthValue
  }

  return `${month}/${year}`
}

function getUpcomingMonthOptions(count = 12): { value: string; label: string }[] {
  const now = new Date()
  const startYear = now.getUTCFullYear()
  const startMonth = now.getUTCMonth()
  const options: { value: string; label: string }[] = []

  for (let i = 0; i < count; i += 1) {
    const monthDate = new Date(Date.UTC(startYear, startMonth + i, 1))
    const year = monthDate.getUTCFullYear()
    const month = monthDate.getUTCMonth() + 1
    options.push({
      value: `${year}-${String(month).padStart(2, '0')}`,
      label: `${month}/${year}`,
    })
  }

  return options
}

function formatMonthRange(startDate: string, endDate: string) {
  return `${startDate} - ${endDate}`
}

export function SprintsManager({ companyId, userId, isAdmin }: SprintsManagerProps) {
  const t = useTranslation()
  const { confirm, Modal: ConfirmModal } = useConfirmModal()
  const defaultMonthValue = getDefaultMonthValue()
  const monthOptions = useMemo(() => getUpcomingMonthOptions(12), [])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthValue, setMonthValue] = useState(defaultMonthValue)
  const [name, setName] = useState(getSprintNameFromMonth(defaultMonthValue))
  const [isCreating, setIsCreating] = useState(false)
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [closingSprintId, setClosingSprintId] = useState<string | null>(null)

  const activeSprintId = useMemo(
    () => sprints.find((sprint) => sprint.status === 'active')?.id || null,
    [sprints]
  )

  const sortedSprints = useMemo(
    () => [...sprints].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [sprints]
  )

  const loadSprints = async () => {
    setIsLoading(true)
    try {
      const data = await getSprints(companyId)
      setSprints(data || [])
    } catch (error) {
      console.error('Failed to load sprints:', error)
      toast.error(t('kanban.sprintCreateError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSprints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const handleCreate = async () => {
    if (!isAdmin) return
    if (!name.trim()) {
      toast.error(t('kanban.sprintNameRequired'))
      return
    }

    setIsCreating(true)
    try {
      const sprint = await createMonthlySprint(companyId, monthValue, name.trim(), userId, !activeSprintId)
      const next = [sprint, ...sprints]
      setSprints(next)
      await logActivity(
        userId,
        null,
        null,
        'sprint_created',
        { sprint_name: sprint.name, sprint_id: sprint.id },
        companyId
      )
      if (sprint.status === 'active') {
        await logActivity(
          userId,
          null,
          null,
          'sprint_started',
          { sprint_name: sprint.name, sprint_id: sprint.id },
          companyId
        )
      }
      const nextDefaultMonth = getDefaultMonthValue()
      setMonthValue(nextDefaultMonth)
      setName(getSprintNameFromMonth(nextDefaultMonth))
      toast.success(t('kanban.sprintCreated'))
    } catch (error: any) {
      console.error('Failed to create sprint:', error)
      toast.error(error?.message || t('kanban.sprintCreateError'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveName = async (sprint: Sprint) => {
    if (!isAdmin) return
    if (!editName.trim()) {
      toast.error(t('kanban.sprintNameRequired'))
      return
    }
    setIsSaving(true)
    try {
      const updated = await updateSprint(sprint.id, { name: editName.trim() })
      setSprints((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditingSprintId(null)
      setEditName('')
      toast.success(t('kanban.sprintUpdated'))
    } catch (error: any) {
      console.error('Failed to update sprint:', error)
      toast.error(error?.message || t('kanban.sprintUpdateError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetActive = async (target: Sprint) => {
    if (!isAdmin) return
    setIsSaving(true)
    try {
      let next = sprints
      const previousActive = sprints.find((item) => item.status === 'active')
      if (previousActive && previousActive.id !== target.id) {
        const closedPrev = await updateSprint(previousActive.id, {
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        next = next.map((item) => (item.id === closedPrev.id ? closedPrev : item))
      }

      const updated = await updateSprint(target.id, { status: 'active', closed_at: null })
      next = next.map((item) => (item.id === updated.id ? updated : item))
      setSprints(next)

      await logActivity(
        userId,
        null,
        null,
        'sprint_started',
        { sprint_name: updated.name, sprint_id: updated.id },
        companyId
      )
      toast.success(t('kanban.sprintActivated'))
    } catch (error: any) {
      console.error('Failed to activate sprint:', error)
      toast.error(error?.message || t('kanban.sprintUpdateError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = async (sprint: Sprint) => {
    if (!isAdmin) return

    const confirmed = await confirm({
      title: t('kanban.closeSprintConfirmTitle'),
      description: t('kanban.closeSprintConfirmDescription'),
      confirmText: t('kanban.closeSprint'),
      cancelText: t('common.cancel'),
      variant: 'warning',
    })

    if (!confirmed) return

    setClosingSprintId(sprint.id)
    try {
      const result = await closeSprintAndCarryOver(companyId, sprint.id, userId)
      await loadSprints()
      await logActivity(
        userId,
        null,
        null,
        'sprint_closed',
        {
          sprint_name: result.closedSprint.name,
          sprint_id: result.closedSprint.id,
          moved_task_count: result.movedTaskCount,
          target_sprint_id: result.targetSprint.id,
          target_sprint_name: result.targetSprint.name,
        },
        companyId
      )
      await logActivity(
        userId,
        null,
        null,
        'sprint_started',
        { sprint_name: result.targetSprint.name, sprint_id: result.targetSprint.id },
        companyId
      )
      toast.success(
        t('kanban.sprintClosedWithCarryOver', {
          count: result.movedTaskCount,
          sprint: result.targetSprint.name,
        })
      )
    } catch (error: any) {
      console.error('Failed to close sprint:', error)
      toast.error(error?.message || t('kanban.sprintUpdateError'))
    } finally {
      setClosingSprintId(null)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <p className="text-sm text-muted-foreground">{t('kanban.adminOnlySprints')}</p>
      ) : (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="company-sprint-name">{t('kanban.sprintName')}</Label>
              <Input
                id="company-sprint-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('kanban.sprintNamePlaceholder')}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-sprint-month">{t('kanban.sprintMonth')}</Label>
              <Select
                value={monthValue}
                onValueChange={(nextMonthValue) => {
                  const currentAutoName = getSprintNameFromMonth(monthValue)
                  const nextAutoName = getSprintNameFromMonth(nextMonthValue)
                  setMonthValue(nextMonthValue)
                  setName((prev) => (prev.trim() === '' || prev === currentAutoName ? nextAutoName : prev))
                }}
                disabled={isCreating}
              >
                <SelectTrigger id="company-sprint-month" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={isCreating}>
                {t('kanban.createSprint')}
              </Button>
            </div>
          </div>
          {!activeSprintId && (
            <p className="text-xs text-muted-foreground">{t('kanban.firstSprintBecomesActive')}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {sortedSprints.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('kanban.noSprints')}</p>
        ) : (
          sortedSprints.map((sprint) => (
            <div key={sprint.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                {editingSprintId === sprint.id ? (
                  <Input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleSaveName(sprint)
                      }
                    }}
                    disabled={isSaving}
                  />
                ) : (
                  <p className="truncate text-sm font-medium">{sprint.name}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatMonthRange(sprint.start_date, sprint.end_date)}</p>
              </div>
              <Badge variant={sprint.status === 'active' ? 'default' : sprint.status === 'planned' ? 'secondary' : 'outline'}>
                {sprint.status}
              </Badge>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  {editingSprintId === sprint.id ? (
                    <Button size="sm" onClick={() => handleSaveName(sprint)} disabled={isSaving}>
                      {t('common.save')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSprintId(sprint.id)
                        setEditName(sprint.name)
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                  )}
                  {sprint.status !== 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActive(sprint)} disabled={isSaving}>
                      {t('kanban.setActive')}
                    </Button>
                  )}
                  {sprint.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClose(sprint)}
                      disabled={closingSprintId === sprint.id}
                    >
                      {t('kanban.closeSprint')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {ConfirmModal}
    </div>
  )
}
