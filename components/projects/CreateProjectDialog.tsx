'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProject, getProjectCount } from '@/lib/supabase/queries/projects'
import { logProjectCreated } from '@/lib/supabase/queries/activities'
import { usePremium } from '@/lib/hooks/usePremium'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { cn } from '@/lib/utils'
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
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onProjectCreated?: () => void
}

export function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  userId,
  onProjectCreated 
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { isPremium, loading: premiumLoading } = usePremium(userId)
  const t = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check premium status and project limit for free users
      // If premium status is still loading, check project count to be safe
      if (premiumLoading || !isPremium) {
        const projectCount = await getProjectCount(userId)
        if (projectCount >= 3 && !isPremium) {
          setLoading(false)
          setShowUpgradeDialog(true)
          return
        }
      }

      const newProject = await createProject({
        user_id: userId,
        title,
        description: description || null,
        color,
        status,
      })

      // Activity log ekle
      await logProjectCreated(userId, newProject.id, title)

      toast.success(t('projects.projectCreatedSuccessfully'))
      
      // Reset form
      setTitle('')
      setDescription('')
      setColor(COLORS[0])
      setStatus('active')
      
      // Close dialog first
      onOpenChange(false)
      
      // Callback if provided (for parent components to handle refresh)
      onProjectCreated?.()
      
      // Refresh page data to update the projects list
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      toast.error(t('projects.failedToCreateProject'))
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !loading) {
      // Reset form when closing
      setTitle('')
      setDescription('')
      setColor(COLORS[0])
      setStatus('active')
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-full sm:!w-[900px] !max-w-none max-h-none sm:max-h-[95vh] h-full sm:h-auto overflow-hidden p-0 flex flex-col rounded-none sm:rounded-lg fixed top-0 left-0 right-0 bottom-0 sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%]">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">{t('projects.createNewProject')}</DialogTitle>
                <DialogDescription className="text-sm">
                  {t('projects.startNewProject')}
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

          <div className="space-y-2 min-w-0">
            <Label htmlFor="description" className="text-sm sm:text-base">{t('projects.description')}</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={t('projects.whatIsThisProjectAbout')}
              minHeight="300px"
              className="h-[300px] sm:h-[400px] lg:h-[500px]"
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
              {t('projects.youCanChangeThisLater')}
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
                  <Plus className="w-4 h-4 sm:mr-2" />
                  {loading ? t('projects.creating') : t('projects.createProject')}
                </Button>
              </div>
            </div>
          </form>
      </DialogContent>
    </Dialog>
    <UpgradeDialog 
      open={showUpgradeDialog} 
      onOpenChange={setShowUpgradeDialog}
      feature="Unlimited Projects"
    />
    </>
  )
}

