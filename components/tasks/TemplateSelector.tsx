'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTaskTemplates } from '@/lib/supabase/queries/taskTemplates'
import type { TaskTemplate } from '@/lib/supabase/queries/taskTemplates'

interface TemplateSelectorProps {
  userId: string
  onSelect: (template: TaskTemplate) => void
  placeholder?: string
}

export function TemplateSelector({ userId, onSelect, placeholder = 'Select template...' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [userId])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getTaskTemplates(userId)
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      onSelect(template)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading templates...
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        No templates available
      </div>
    )
  }

  return (
    <Select onValueChange={handleSelect}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{template.title}</span>
              {template.priority && (
                <span className="text-xs text-gray-500">({template.priority})</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

