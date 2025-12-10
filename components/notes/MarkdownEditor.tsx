'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Edit } from 'lucide-react'
import { markdownToHtml } from '@/lib/utils/markdown'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [html, setHtml] = useState('')
  const t = useTranslation()

  useEffect(() => {
    if (mode === 'preview' || mode === 'split') {
      // First convert note links [[Note Title]] to markdown links
      // Then parse markdown to HTML
      let processedMarkdown = value
      // Convert [[Note Title]] to markdown links before parsing
      processedMarkdown = processedMarkdown.replace(
        /\[\[([^\]]+)\]\]/g,
        (match, noteTitle) => {
          const title = noteTitle.trim()
          const encodedTitle = encodeURIComponent(title)
          return `[${title}](/notes?search=${encodedTitle})`
        }
      )
      let htmlContent = markdownToHtml(processedMarkdown)
      setHtml(htmlContent)
    }
  }, [value, mode])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="flex flex-col flex-1 min-h-0">
        <TabsList className="flex-shrink-0 w-full sm:w-auto">
          <TabsTrigger value="edit" className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('notes.edit')}</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('notes.preview')}</span>
          </TabsTrigger>
          <TabsTrigger value="split" className="flex-1 sm:flex-initial text-xs sm:text-sm hidden sm:flex">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('notes.split')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 flex-1 min-h-0 flex flex-col">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 font-mono text-xs sm:text-sm resize-none"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4 flex-1 min-h-0">
          <div
            className="h-full p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-y-auto markdown-content text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              lineHeight: '1.6',
            }}
          />
        </TabsContent>

        <TabsContent value="split" className="mt-4 flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="flex flex-col min-h-0">
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 font-mono text-xs sm:text-sm resize-none min-h-0"
              />
            </div>
            <div
              className="flex-1 min-h-0 p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-y-auto markdown-content text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: html }}
              style={{
                lineHeight: '1.6',
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

