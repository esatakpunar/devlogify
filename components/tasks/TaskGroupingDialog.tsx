'use client'

import { useState, useEffect } from 'react'
import { Layers, Loader2, Check, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface TaskGroup {
  id: string
  name: string
  tasks: any[]
  suggestedTags: string[]
  reason: string
}

interface TaskGroupingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  userId: string
  onTasksUpdated?: () => void
}

export function TaskGroupingDialog({ open, onOpenChange, projectId, userId, onTasksUpdated }: TaskGroupingDialogProps) {
  const [groups, setGroups] = useState<TaskGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslation()

  useEffect(() => {
    if (open) {
      loadGroups()
    }
  }, [open, projectId])

  const loadGroups = async () => {
    setLoading(true)
    setError(null)
    setSelectedGroups(new Set())
    
    try {
      const response = await fetch('/api/ai/group-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('kanban.failedToLoadGroups'))
      }

      const data = await response.json()
      const loadedGroups = data.groups || []
      
      setGroups(loadedGroups)
    } catch (err: any) {
      console.error('Error loading groups:', err)
      setError(err.message || t('kanban.failedToLoadGroups'))
    } finally {
      setLoading(false)
    }
  }

  const toggleGroupSelection = (groupId: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId)
    } else {
      newSelected.add(groupId)
    }
    setSelectedGroups(newSelected)
  }

  const applyTagsToSelectedGroups = async () => {
    if (selectedGroups.size === 0) {
      toast.error(t('kanban.pleaseSelectAtLeastOneGroup'))
      return
    }

    setApplying(true)
    
    try {
      // Collect all task IDs and tags from selected groups
      const taskTagMap = new Map<string, Set<string>>()
      
      groups
        .filter(group => selectedGroups.has(group.id))
        .forEach(group => {
          group.tasks.forEach(task => {
            if (!task || !task.id) {
              console.warn('Invalid task found in group:', task)
              return
            }
            
            if (!taskTagMap.has(task.id)) {
              taskTagMap.set(task.id, new Set())
            }
            group.suggestedTags.forEach(tag => {
              taskTagMap.get(task.id)!.add(tag)
            })
          })
        })

      // Apply tags to each task
      const applyPromises = Array.from(taskTagMap.entries()).map(async ([taskId, tags]) => {
        const tagsArray = Array.from(tags)
        
        const response = await fetch('/api/tasks/add-tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskIds: [taskId],
            tags: tagsArray,
          }),
        })

        const responseData = await response.json()
        
        if (!response.ok) {
          console.error(`Failed to add tags to task ${taskId}:`, responseData)
          throw new Error(responseData.error || 'Failed to add tags')
        }
        
        return responseData
      })

      await Promise.all(applyPromises)

      const totalTasks = taskTagMap.size
      const totalTags = new Set(Array.from(taskTagMap.values()).flatMap(tags => Array.from(tags))).size
      
      const tasksText = totalTasks === 1 ? t('common.task') : t('common.tasks')
      const tagsText = totalTags === 1 ? 'tag' : 'tags'
      toast.success(t('kanban.tagsApplied', { 
        tasks: totalTasks, 
        tags: totalTags,
        tasksText,
        tagsText
      }))
      
      // Clear selection
      setSelectedGroups(new Set())
      
      // Refresh tasks
      onTasksUpdated?.()
    } catch (err: any) {
      console.error('Error applying tags:', err)
      toast.error(err.message || t('kanban.failedToApplyTags'))
    } finally {
      setApplying(false)
    }
  }

  const selectAllGroups = () => {
    setSelectedGroups(new Set(groups.map(g => g.id)))
  }

  const deselectAllGroups = () => {
    setSelectedGroups(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            {t('kanban.taskGrouping')}
          </DialogTitle>
          <DialogDescription>
            {t('kanban.taskGroupingDescription')}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={loadGroups}>
              {t('common.tryAgain')}
            </Button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">{t('kanban.noGroupsFound')}</p>
            <p className="text-xs mt-1">{t('kanban.createMoreTasksToEnableGrouping')}</p>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="space-y-4">
            {/* Selection controls */}
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('kanban.groupsSelected', { selected: selectedGroups.size, total: groups.length })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllGroups}
                  disabled={selectedGroups.size === groups.length}
                >
                  {t('kanban.selectAll')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllGroups}
                  disabled={selectedGroups.size === 0}
                >
                  {t('kanban.deselectAll')}
                </Button>
              </div>
            </div>

            {/* Groups */}
            {groups.map((group) => {
              const isSelected = selectedGroups.has(group.id)
              return (
                <Card 
                  key={group.id} 
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleGroupSelection(group.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold mb-1">{group.name}</h4>
                      </div>
                      {group.reason && (
                        <p className="text-xs text-gray-500 mb-2">{group.reason}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {group.suggestedTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {group.tasks.length} {group.tasks.length === 1 ? t('common.task') : t('common.tasks')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <div className="space-y-1">
                      {group.tasks.map((task) => (
                        <div key={task.id} className="text-sm text-gray-700 dark:text-gray-300">
                          • {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <div className="flex gap-2">
            {!loading && !error && groups.length > 0 && selectedGroups.size > 0 && (
              <Button 
                onClick={applyTagsToSelectedGroups}
                disabled={applying}
                className="flex items-center gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('kanban.applying')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('kanban.applyTags', { 
                      count: selectedGroups.size,
                      groupText: selectedGroups.size === 1 ? t('kanban.group') : t('kanban.groups')
                    })}
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!loading && !error && groups.length > 0 && (
              <Button onClick={loadGroups} variant="outline" size="sm">
                {t('common.refresh')}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

