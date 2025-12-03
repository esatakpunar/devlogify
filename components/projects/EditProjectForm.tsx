'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProject, deleteProject } from '@/lib/supabase/queries/projects'
import { logProjectUpdated, logProjectDeleted } from '@/lib/supabase/queries/activities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'
import { useTranslation } from '@/lib/i18n/useTranslation'

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
]

interface EditProjectFormProps {
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
  }
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>(project.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { confirm, confirmWithAction, Modal: ConfirmModal } = useConfirmModal()
  const t = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const updatedProject = await updateProject(project.id, {
        title,
        description: description || null,
        color,
        status,
      })

      // Activity log ekle
      await logProjectUpdated(
        user.id,
        updatedProject.id,
        title,
        {
          title: project.title !== title,
          description: project.description !== description,
          color: project.color !== color,
          status: project.status !== status,
        }
      )

      router.push(`/projects/${updatedProject.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('projects.areYouSureDeleteProjectWithTasks'),
      description: t('projects.deleteProjectDescription'),
      confirmText: t('projects.deleteProject'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
    })

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Log activity before deleting
      await logProjectDeleted(user.id, project.id, project.title)

      await deleteProject(project.id)

      router.push('/projects')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('projects.backToProject')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{t('projects.editProject')}</h1>
        <p className="text-gray-600 mt-1">
          {t('projects.updateProjectDetails')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">
            {t('projects.projectName')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder={t('projects.projectNamePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('projects.description')}</Label>
          <Textarea
            id="description"
            placeholder={t('projects.whatIsThisProjectAbout')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t('projects.status')}</Label>
          <Select 
            value={status} 
            onValueChange={(value: 'active' | 'archived' | 'completed') => setStatus(value)}
            disabled={loading}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('common.active')}</SelectItem>
              <SelectItem value="completed">{t('common.completed')}</SelectItem>
              <SelectItem value="archived">{t('common.archived')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {t('projects.archivedProjectsWontShow')}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t('projects.projectColor')}</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  color === c 
                    ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                disabled={loading}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {loading ? t('projects.saving') : t('projects.saveChanges')}
          </Button>
          <Link href={`/projects/${project.id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full" disabled={loading}>
              {t('common.cancel')}
            </Button>
          </Link>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-red-600">{t('projects.dangerZone')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('projects.irreversibleActions')}
          </p>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div>
            <h3 className="font-medium text-red-900">{t('projects.deleteThisProject')}</h3>
            <p className="text-sm text-red-700 mt-1">
              {t('projects.deleteProjectWarning')}
            </p>
          </div>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {t('projects.deleteProject')}
          </Button>
        </div>
      </div>
      {ConfirmModal}
    </div>
  )
}