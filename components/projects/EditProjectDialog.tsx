'use client'

import { useState, useEffect } from 'react'
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

      toast.success('Project updated successfully!')
      
      // Close dialog
      onOpenChange(false)
      
      // Callback if provided
      onProjectUpdated?.()
      
      // Refresh page data
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to update project')
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

      toast.success('Project deleted successfully')
      
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
      toast.error('Failed to delete project')
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
    }
    onOpenChange(newOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="My Awesome Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="resize-none break-words overflow-wrap-anywhere w-full max-w-full h-48 overflow-y-auto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value: 'active' | 'archived' | 'completed') => setStatus(value)}
                disabled={loading}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Archived projects won't show in your active projects list
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-2">
              <Label className="text-red-600 dark:text-red-400">Danger Zone</Label>
              <p className="text-xs text-gray-500">
                Irreversible and destructive actions
              </p>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
                className="w-full"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

