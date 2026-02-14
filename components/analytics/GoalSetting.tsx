'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Target, Plus, Edit2, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'
import type { Database } from '@/types/supabase'

interface Goal {
  id: string
  type: 'tasks' | 'time' | 'projects'
  target: number
  period: 'daily' | 'weekly' | 'monthly'
  createdAt: string
}

interface GoalSettingProps {
  userId: string
}

const GOALS_KEY = 'devlogify-goals'

export function GoalSetting({ userId }: GoalSettingProps) {
  const t = useTranslation()
  const [goals, setGoals] = useState<Goal[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: 'tasks' as 'tasks' | 'time' | 'projects',
    target: '',
    period: 'weekly' as 'daily' | 'weekly' | 'monthly',
  })
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const { confirm, confirmWithAction, Modal: ConfirmModal } = useConfirmModal()

  useEffect(() => {
    loadGoals()
    loadProgress()
  }, [userId])

  const loadGoals = () => {
    try {
      const saved = localStorage.getItem(GOALS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setGoals(parsed.filter((g: Goal) => g.id.startsWith(userId)))
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const supabase = createClient()
      
      // Calculate weekly stats manually
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1) // Monday
      weekStart.setHours(0, 0, 0, 0)

      const progressMap: Record<string, number> = {}
      type TimeEntryDuration = Pick<Database['public']['Tables']['time_entries']['Row'], 'duration'>

      for (const goal of goals) {
        if (goal.period === 'weekly') {
          if (goal.type === 'tasks') {
            const { count } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', 'done')
              .gte('completed_at', weekStart.toISOString())
            progressMap[goal.id] = count || 0
          } else if (goal.type === 'time') {
            const { data: timeEntriesData } = await supabase
              .from('time_entries')
              .select('duration')
              .eq('user_id', userId)
              .gte('started_at', weekStart.toISOString())
              .not('duration', 'is', null)
            const timeEntries = (timeEntriesData || []) as TimeEntryDuration[]
            const minutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0
            progressMap[goal.id] = minutes
          } else if (goal.type === 'projects') {
            const { count } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .gte('created_at', weekStart.toISOString())
            progressMap[goal.id] = count || 0
          }
        } else if (goal.period === 'daily') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (goal.type === 'tasks') {
            const { count } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', 'done')
              .gte('completed_at', today.toISOString())
            progressMap[goal.id] = count || 0
          } else if (goal.type === 'time') {
            const { data: timeEntriesData } = await supabase
              .from('time_entries')
              .select('duration')
              .eq('user_id', userId)
              .gte('started_at', today.toISOString())
              .not('duration', 'is', null)
            const timeEntries = (timeEntriesData || []) as TimeEntryDuration[]
            const minutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0
            progressMap[goal.id] = minutes
          }
        }
      }

      setProgress(progressMap)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const saveGoals = (newGoals: Goal[]) => {
    try {
      const allGoals = JSON.parse(localStorage.getItem(GOALS_KEY) || '[]')
      const otherGoals = allGoals.filter((g: Goal) => !g.id.startsWith(userId))
      localStorage.setItem(GOALS_KEY, JSON.stringify([...otherGoals, ...newGoals]))
      setGoals(newGoals)
    } catch (error) {
      console.error('Failed to save goals:', error)
    }
  }

  const handleAdd = () => {
    if (!formData.target || Number(formData.target) <= 0) {
      toast.error(t('analytics.pleaseEnterValidTarget'))
      return
    }

    const newGoal: Goal = {
      id: `${userId}-${Date.now()}`,
      type: formData.type,
      target: Number(formData.target),
      period: formData.period,
      createdAt: new Date().toISOString(),
    }

    saveGoals([...goals, newGoal])
    setFormData({ type: 'tasks', target: '', period: 'weekly' })
    setShowAddForm(false)
    toast.success(t('analytics.goalAdded'))
    loadProgress()
  }

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setFormData({
      type: goal.type,
      target: goal.target.toString(),
      period: goal.period,
    })
    setShowAddForm(true)
  }

  const handleUpdate = () => {
    if (!editingId || !formData.target || Number(formData.target) <= 0) {
      toast.error(t('analytics.pleaseEnterValidTarget'))
      return
    }

    const updated = goals.map(g =>
      g.id === editingId
        ? { ...g, type: formData.type, target: Number(formData.target), period: formData.period }
        : g
    )

    saveGoals(updated)
    setEditingId(null)
    setFormData({ type: 'tasks', target: '', period: 'weekly' })
    setShowAddForm(false)
    toast.success(t('analytics.goalUpdated'))
    loadProgress()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('analytics.areYouSureDeleteGoal'),
      description: t('analytics.deleteGoalDescription'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    })

    if (!confirmed) return

    const updated = goals.filter(g => g.id !== id)
    saveGoals(updated)
    toast.success(t('analytics.goalDeleted'))
    loadProgress()
  }

  const getProgress = (goal: Goal) => {
    const current = progress[goal.id] || 0
    const percentage = Math.min((current / goal.target) * 100, 100)
    return { current, percentage }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tasks': return t('analytics.goalTypeTasks')
      case 'time': return t('analytics.goalTypeTime')
      case 'projects': return t('analytics.goalTypeProjects')
      default: return type
    }
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return t('analytics.goalPeriodDaily')
      case 'weekly': return t('analytics.goalPeriodWeekly')
      case 'monthly': return t('analytics.goalPeriodMonthly')
      default: return period
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('analytics.goals')}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingId(null)
            setFormData({ type: 'tasks', target: '', period: 'weekly' })
          }}
          className="w-full sm:w-auto text-xs sm:text-sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('analytics.addGoal')}</span>
          <span className="sm:hidden">{t('common.add')}</span>
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2 sm:space-y-3">
          <div>
            <Label className="text-xs sm:text-sm">{t('analytics.goalType')}</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full mt-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="tasks">{t('analytics.goalTypeTasks')}</option>
              <option value="time">{t('analytics.goalTypeTime')}</option>
              <option value="projects">{t('analytics.goalTypeProjects')}</option>
            </select>
          </div>
          <div>
            <Label className="text-xs sm:text-sm">{t('analytics.goalTarget')}</Label>
            <Input
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              placeholder={t('analytics.enterTarget')}
              className="text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">{t('analytics.goalPeriod')}</Label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
              className="w-full mt-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="daily">{t('analytics.goalPeriodDaily')}</option>
              <option value="weekly">{t('analytics.goalPeriodWeekly')}</option>
              <option value="monthly">{t('analytics.goalPeriodMonthly')}</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              onClick={editingId ? handleUpdate : handleAdd}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {editingId ? t('common.update') : t('common.add')} {t('analytics.goal')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setEditingId(null)
                setFormData({ type: 'tasks', target: '', period: 'weekly' })
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {goals.length === 0 ? (
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-6 sm:py-8">
            {t('analytics.noGoalsSet')}
          </p>
        ) : (
          goals.map((goal) => {
            const { current, percentage } = getProgress(goal)
            return (
              <div key={goal.id} className="p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="flex items-start sm:items-center justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium dark:text-gray-200">
                      {getTypeLabel(goal.type)} - {getPeriodLabel(goal.period)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {current} / {goal.target} {goal.type === 'time' ? t('common.minutes') : goal.type}
                    </p>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(goal)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(goal.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
                <ProgressBar value={percentage} />
              </div>
            )
          })
        )}
      </div>
      {ConfirmModal}
    </Card>
  )
}
