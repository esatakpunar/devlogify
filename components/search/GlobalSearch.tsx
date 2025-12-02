'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, FolderKanban, CheckSquare, FileText, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { saveSearchHistory } from '@/lib/utils/filtering'
import { cn } from '@/lib/utils'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function GlobalSearch({ open, onOpenChange, userId }: GlobalSearchProps) {
  const t = useTranslation()
  const router = useRouter()
  const { query, results, loading, search, clear } = useGlobalSearch(userId)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      setSearchQuery('')
      clear()
    }
  }, [open, clear])

  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      clear()
      return
    }
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        search(searchQuery)
        saveSearchHistory(searchQuery, 'task') // Could be more specific
      } else {
        clear()
      }
    }, 300) // Debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, open, search, clear])

  const handleSelect = (result: any) => {
    router.push(result.url)
    onOpenChange(false)
    clear()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderKanban className="w-4 h-4" />
      case 'task':
        return <CheckSquare className="w-4 h-4" />
      case 'note':
        return <FileText className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project':
        return 'Project'
      case 'task':
        return 'Task'
      case 'note':
        return 'Note'
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search across all projects, tasks, and notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects, tasks, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && searchQuery && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200',
                    'hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left',
                    'dark:border-gray-800'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded',
                    result.type === 'project' && 'bg-blue-100 dark:bg-blue-900/20',
                    result.type === 'task' && 'bg-green-100 dark:bg-green-900/20',
                    result.type === 'note' && 'bg-purple-100 dark:bg-purple-900/20'
                  )}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && !searchQuery && (
            <div className="text-center py-8 text-gray-500">
              Start typing to search...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

