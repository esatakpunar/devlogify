'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProject, deleteProject } from '@/lib/supabase/queries/projects'
import { logProjectUpdated, logProjectDeleted } from '@/lib/supabase/queries/activities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Save, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { cn } from '@/lib/utils'

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

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: {
    id: string
    title: string
    description: string | null
    color: string
    status: 'active' | 'archived' | 'completed'
  }
  userId: string
  onProjectUpdated?: () => void
}

export function EditProjectDialog({ 
  open, 
  onOpenChange, 
  project,
  userId,
  onProjectUpdated 
}: EditProjectDialogProps) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>(project.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()

  // Update form when project changes
  useEffect(() => {
    if (open && project) {
      setTitle(project.title)
      setDescription(project.description || '')
      setColor(project.color)
      setStatus(project.status)
      setError(null)
    }
  }, [open, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updatedProject = await updateProject(project.id, {
        title,
        description: description || null,
        color,
        status,
      })

      // Activity log ekle
      await logProjectUpdated(
        userId,
        updatedProject.id,
        title,
        {
          title: project.title !== title,
          description: project.description !== description,
          color: project.color !== color,
          status: project.status !== status,
        }
      )

      toast.success(t('projects.projectUpdatedSuccessfully'))
      
      // Close dialog
      onOpenChange(false)
      
      // Callback if provided
      onProjectUpdated?.()
      
      // Refresh page data
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      toast.error(t('projects.failedToUpdateProject'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Log activity before deleting
      await logProjectDeleted(userId, project.id, project.title)

      await deleteProject(project.id)

      toast.success(t('projects.projectDeletedSuccessfully'))
      
      // Close dialogs
      setShowDeleteDialog(false)
      onOpenChange(false)
      
      // Callback if provided
      onProjectUpdated?.()
      
      // Navigate to projects page
      router.push('/projects')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      toast.error(t('projects.failedToDeleteProject'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      // Reset form when closing
      setTitle(project.title)
      setDescription(project.description || '')
      setColor(project.color)
      setStatus(project.status)
      setError(null)
      setLoading(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-full sm:!w-[600px] lg:!w-[900px] !max-w-none max-h-none sm:max-h-[95vh] h-full sm:h-auto overflow-hidden p-0 flex flex-col rounded-none sm:rounded-lg fixed top-0 left-0 right-0 bottom-0 sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%]">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">{t('projects.editProject')}</DialogTitle>
                <DialogDescription className="text-sm">
                  {t('projects.updateProjectDetails')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 min-h-0">
              <div className="space-y-3 sm:space-y-4 min-w-0">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">
                {t('projects.projectName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder={t('projects.projectNamePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="edit-description" className="text-sm sm:text-base">{t('projects.description')}</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder={t('projects.whatIsThisProjectAbout')}
                className="flex-1 min-h-[350px] sm:min-h-[400px] min-w-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">{t('projects.status')}</Label>
              <Select 
                value={status} 
                onValueChange={(value: 'active' | 'archived' | 'completed') => setStatus(value)}
                disabled={loading}
              >
                <SelectTrigger id="edit-status">
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

                {/* Danger Zone */}
                <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="space-y-2">
                    <Label className="text-red-600 dark:text-red-400">{t('projects.dangerZone')}</Label>
                    <p className="text-xs text-gray-500">
                      {t('projects.irreversibleActions')}
                    </p>
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={loading}
                      className="w-full"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      {t('projects.deleteProject')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-background sticky bottom-0 z-10">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                  className="w-full sm:w-auto h-10 sm:h-9"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:flex-1 h-10 sm:h-9">
                  <Save className="w-4 h-4 sm:mr-2" />
                  {loading ? t('projects.saving') : t('projects.saveChanges')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.areYouSureDeleteProject')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.deleteProjectDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? t('projects.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
