'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProject, getProjectCount } from '@/lib/supabase/queries/projects'
import type { Project } from '@/lib/supabase/queries/projects'
import { logProjectCreated } from '@/lib/supabase/queries/activities'
import { usePremium } from '@/lib/hooks/usePremium'
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
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useCompanyStore } from '@/lib/store/companyStore'

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

const DRAFT_KEY = 'create-project-draft'

export function CreateProjectForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [status, setStatus] = useState<'active' | 'archived' | 'completed'>('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { company } = useCompanyStore()
  const { isPremium, loading: premiumLoading } = usePremium(userId || undefined)
  const t = useTranslation()

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
      }
    })
  }, [supabase])

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setTitle(parsed.title || '')
        setDescription(parsed.description || '')
        setColor(parsed.color || COLORS[0])
        setStatus(parsed.status || 'active')
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    if (title || description) {
      const draft = {
        title,
        description,
        color,
        status,
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
        setDraftSaved(true)
        const timer = setTimeout(() => setDraftSaved(false), 2000)
        return () => clearTimeout(timer)
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }
  }, [title, description, color, status])

  // Real-time validation
  useEffect(() => {
    if (title.trim().length === 0) {
      setTitleError(null)
    } else if (title.trim().length < 3) {
      setTitleError(t('projects.titleValidationMin'))
    } else if (title.trim().length > 100) {
      setTitleError(t('projects.titleValidationMax'))
    } else {
      setTitleError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate before submit
    if (titleError || !title.trim() || title.trim().length < 3) {
      setError(t('projects.fixErrorsBeforeSubmit'))
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Check premium status and project limit for free users
      // If premium status is still loading, check project count to be safe
      if (premiumLoading || !isPremium) {
        const projectCount = await getProjectCount(user.id)
        if (projectCount >= 3 && !isPremium) {
          setLoading(false)
          setShowUpgradeDialog(true)
          return
        }
      }

      const newProject = (await createProject({
        user_id: user.id,
        company_id: company?.id || null,
        title,
        description: description || null,
        color,
        status,
      })) as Project

      // Activity log ekle
      await logProjectCreated(user.id, newProject.id, title)

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY)
      
      toast.success('Project created successfully!')
      router.push(`/projects/${newProject.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to create project')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-gray-600 mt-1">
            Start a new project to organize and track your work
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
          <div className="flex items-center justify-between">
            <Label htmlFor="title">
              Project Name <span className="text-red-500">*</span>
            </Label>
            {draftSaved && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('common.draftSaved')}
              </span>
            )}
          </div>
          <Input
            id="title"
            placeholder="My Awesome Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            className={titleError ? 'border-red-500' : ''}
          />
          {titleError && (
            <p className="text-xs text-red-600 dark:text-red-400">{titleError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={status} 
            onValueChange={(value: 'active' | 'archived' | 'completed') => setStatus(value)}
            disabled={loading}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            You can change this later from the project settings
          </p>
        </div>

        <div className="space-y-2">
          <Label>Project Color</Label>
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
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
          <Link href="/projects" className="flex-1">
            <Button type="button" variant="outline" className="w-full" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
    <UpgradeDialog 
      open={showUpgradeDialog} 
      onOpenChange={setShowUpgradeDialog}
      feature="Unlimited Projects"
    />
    </>
  )
}
