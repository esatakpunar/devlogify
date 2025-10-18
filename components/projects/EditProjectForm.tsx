'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  '#6366f1', // Indigo
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
  
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')
  
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          color,
          status: 'active',
        })
        .select()
        .single()
  
      if (error) throw error
  
      // Activity log ekle
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          project_id: data.id,
          task_id: null,
          action_type: 'project_created',
          metadata: {
            project_title: title
          }
        })
  
      router.push(`/dashboard/projects/${data.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error

      router.push('/dashboard/projects')
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
        <Link href={`/dashboard/projects/${project.id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Project</h1>
        <p className="text-gray-600 mt-1">
          Update your project details
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
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="My Awesome Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
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

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="text-sm text-gray-600 mt-1">
            Irreversible and destructive actions
          </p>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div>
            <h3 className="font-medium text-red-900">Delete this project</h3>
            <p className="text-sm text-red-700 mt-1">
              Once you delete a project, there is no going back. All tasks will be deleted.
            </p>
          </div>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            Delete Project
          </Button>
        </div>
      </div>
    </div>
  )
}