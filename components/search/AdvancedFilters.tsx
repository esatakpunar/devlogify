'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Filter, X, Save } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { TaskFilter, ProjectFilter, NoteFilter, SavedFilter } from '@/lib/utils/filtering'
import { saveFilter, getSavedFilters, deleteSavedFilter } from '@/lib/utils/filtering'
import { quickFilters } from '@/lib/utils/filtering'

interface AdvancedFiltersProps<T extends TaskFilter | ProjectFilter | NoteFilter> {
  filter: T
  onFilterChange: (filter: T) => void
  type: 'task' | 'project' | 'note'
  availableTags?: string[]
  availableProjects?: Array<{ id: string; title: string }>
}

export function AdvancedFilters<T extends TaskFilter | ProjectFilter | NoteFilter>({
  filter,
  onFilterChange,
  type,
  availableTags = [],
  availableProjects = [],
}: AdvancedFiltersProps<T>) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const savedFilters = getSavedFilters().filter(f => f.type === type)

  const handleQuickFilter = (quickFilter: () => T) => {
    onFilterChange(quickFilter())
    setOpen(false)
  }

  const handleSaveFilter = () => {
    if (!saveName.trim()) return

    const savedFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveName,
      type,
      filter: { ...filter },
      createdAt: new Date().toISOString(),
    }

    saveFilter(savedFilter)
    setSaveName('')
    setShowSaveDialog(false)
  }

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    onFilterChange(savedFilter.filter as T)
    setOpen(false)
  }

  const handleClearFilter = () => {
    onFilterChange({} as T)
  }

  const hasActiveFilters = Object.keys(filter).length > 0

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 rounded">
                {Object.keys(filter).length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Filters</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Quick Filters */}
            {type === 'task' && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Quick Filters</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(quickFilters.tasks.todayCompleted)}
                  >
                    Today Completed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(quickFilters.tasks.thisWeek)}
                  >
                    This Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(quickFilters.tasks.highPriority)}
                  >
                    High Priority
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(quickFilters.tasks.inProgress)}
                  >
                    In Progress
                  </Button>
                </div>
              </div>
            )}

            {/* Task-specific filters */}
            {type === 'task' && (
              <>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-col gap-2">
                    {(['todo', 'in_progress', 'done'] as const).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={(filter as TaskFilter).status?.includes(status) || false}
                          onCheckedChange={(checked) => {
                            const current = (filter as TaskFilter).status || []
                            const newStatus = checked
                              ? [...current, status]
                              : current.filter(s => s !== status)
                            onFilterChange({ ...filter, status: newStatus } as T)
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm font-normal">
                          {status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <div className="flex flex-col gap-2">
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={(filter as TaskFilter).priority?.includes(priority) || false}
                          onCheckedChange={(checked) => {
                            const current = (filter as TaskFilter).priority || []
                            const newPriority = checked
                              ? [...current, priority]
                              : current.filter(p => p !== priority)
                            onFilterChange({ ...filter, priority: newPriority } as T)
                          }}
                        />
                        <Label htmlFor={`priority-${priority}`} className="text-sm font-normal capitalize">
                          {priority}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                      {availableTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={(filter as TaskFilter).tags?.includes(tag) || false}
                            onCheckedChange={(checked) => {
                              const current = (filter as TaskFilter).tags || []
                              const newTags = checked
                                ? [...current, tag]
                                : current.filter(t => t !== tag)
                              onFilterChange({ ...filter, tags: newTags } as T)
                            }}
                          />
                          <Label htmlFor={`tag-${tag}`} className="text-sm font-normal">
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Project-specific filters */}
            {type === 'project' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-col gap-2">
                  {(['active', 'archived', 'completed'] as const).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={(filter as ProjectFilter).status?.includes(status) || false}
                        onCheckedChange={(checked) => {
                          const current = (filter as ProjectFilter).status || []
                          const newStatus = checked
                            ? [...current, status]
                            : current.filter(s => s !== status)
                          onFilterChange({ ...filter, status: newStatus } as T)
                        }}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm font-normal capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note-specific filters */}
            {type === 'note' && (
              <>
                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                      {availableTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={(filter as NoteFilter).tags?.includes(tag) || false}
                            onCheckedChange={(checked) => {
                              const current = (filter as NoteFilter).tags || []
                              const newTags = checked
                                ? [...current, tag]
                                : current.filter(t => t !== tag)
                              onFilterChange({ ...filter, tags: newTags } as T)
                            }}
                          />
                          <Label htmlFor={`tag-${tag}`} className="text-sm font-normal">
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-gray-500">Saved Filters</Label>
                <div className="space-y-1">
                  {savedFilters.map((saved) => (
                    <div key={saved.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start"
                        onClick={() => handleLoadFilter(saved)}
                      >
                        {saved.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSavedFilter(saved.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Filter */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                {showSaveDialog ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Filter name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveFilter}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowSaveDialog(false)
                          setSaveName('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowSaveDialog(true)}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Filter
                  </Button>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

