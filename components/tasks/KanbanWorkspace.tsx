'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanColumn } from '@/components/tasks/KanbanColumn'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog'
import { AICreateTasksDialog } from '@/components/tasks/AICreateTasksDialog'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Sparkles, ChevronDown } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { updateTask, updateTaskStatus } from '@/lib/supabase/queries/tasks'
import { logActivity } from '@/lib/supabase/queries/activities'
import { usePremium } from '@/lib/hooks/usePremium'
import { useCompanyStore } from '@/lib/store/companyStore'

type ProjectOption = {
  id: string
  title: string
  color: string
}

type MemberOption = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

type TaskItem = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  estimated_duration: number | null
  actual_duration: number
  progress: number
  order_index: number
  created_at: string
  updated_at: string
  tags?: string[] | null
  assignee_id?: string | null
  responsible_id?: string | null
  review_status?: 'pending' | 'approved' | 'rejected' | 'changes_requested' | null
  review_note?: string | null
  assignee?: MemberOption | null
  responsible?: MemberOption | null
  project?: {
    id: string
    title: string
    color: string
    status: string
  } | null
}

interface KanbanWorkspaceProps {
  userId: string
  companyId: string
  initialTasks: TaskItem[]
  projects: ProjectOption[]
}

type ViewMode = 'kanban' | 'list'
type SortDirection = 'asc' | 'desc'
type SortKey = 'title' | 'project' | 'status' | 'priority' | 'assignee' | 'responsible' | 'estimated_duration'
type MultiSelectOption = {
  value: string
  label: string
}

function sortByUpdatedAtDesc(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

interface MultiSelectFilterProps {
  label: string
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  selectAllLabel: string
  clearLabel: string
}

function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  selectAllLabel,
  clearLabel,
}: MultiSelectFilterProps) {
  const allSelected = options.length > 0 && selectedValues.length === options.length

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value))
      return
    }
    onChange([...selectedValues, value])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {label}
            {selectedValues.length > 0 ? ` (${selectedValues.length})` : ''}
          </span>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="flex items-center justify-between px-1 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(options.map((option) => option.value))}
            disabled={options.length === 0 || allSelected}
          >
            {selectAllLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange([])}
            disabled={selectedValues.length === 0}
          >
            {clearLabel}
          </Button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 px-1">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => toggleValue(option.value)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function KanbanWorkspace({ userId, companyId, initialTasks, projects }: KanbanWorkspaceProps) {
  const t = useTranslation()
  const { isPremium } = usePremium(userId)
  const { members, fetchMembers } = useCompanyStore()

  const [tasks, setTasks] = useState<TaskItem[]>(sortByUpdatedAtDesc(initialTasks))
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([userId])
  const [selectedResponsibleIds, setSelectedResponsibleIds] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAICreateDialogOpen, setIsAICreateDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)

  useEffect(() => {
    setTasks(sortByUpdatedAtDesc(initialTasks))
  }, [initialTasks])

  useEffect(() => {
    fetchMembers(companyId)
  }, [companyId, fetchMembers])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const filteredTasks = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    return tasks.filter((task) => {
      if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(task.project_id)) return false
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) return false
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) return false

      const assigneeValue = task.assignee_id || '__none__'
      if (selectedAssigneeIds.length > 0 && !selectedAssigneeIds.includes(assigneeValue)) return false

      const responsibleValue = task.responsible_id || '__none__'
      if (selectedResponsibleIds.length > 0 && !selectedResponsibleIds.includes(responsibleValue)) return false

      if (!searchLower) return true

      const searchable = [
        task.title,
        task.description || '',
        task.project?.title || '',
        task.assignee?.full_name || task.assignee?.email || '',
        task.responsible?.full_name || task.responsible?.email || '',
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(searchLower)
    })
  }, [tasks, search, selectedProjectIds, selectedStatuses, selectedPriorities, selectedAssigneeIds, selectedResponsibleIds])

  const todoTasks = useMemo(() => filteredTasks.filter((task) => task.status === 'todo'), [filteredTasks])
  const inProgressTasks = useMemo(() => filteredTasks.filter((task) => task.status === 'in_progress'), [filteredTasks])
  const doneTasks = useMemo(() => filteredTasks.filter((task) => task.status === 'done'), [filteredTasks])

  const sortedListTasks = useMemo(() => {
    const statusOrder: Record<TaskItem['status'], number> = {
      todo: 0,
      in_progress: 1,
      done: 2,
    }

    const priorityOrder: Record<TaskItem['priority'], number> = {
      low: 0,
      medium: 1,
      high: 2,
    }

    const getComparableValue = (task: TaskItem): string | number => {
      switch (sortKey) {
        case 'title':
          return task.title.toLowerCase()
        case 'project':
          return (task.project?.title || '').toLowerCase()
        case 'status':
          return statusOrder[task.status]
        case 'priority':
          return priorityOrder[task.priority]
        case 'assignee':
          return (task.assignee?.full_name || task.assignee?.email || '').toLowerCase()
        case 'responsible':
          return (task.responsible?.full_name || task.responsible?.email || '').toLowerCase()
        case 'estimated_duration':
          return task.estimated_duration || 0
        default:
          return task.title.toLowerCase()
      }
    }

    return [...filteredTasks].sort((a, b) => {
      const aValue = getComparableValue(a)
      const bValue = getComparableValue(b)

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTasks, sortKey, sortDirection])

  const memberOptions = useMemo(() => {
    return members.map((member) => ({
      id: member.user_id,
      full_name: member.profile.full_name,
      email: member.profile.email,
      avatar_url: member.profile.avatar_url,
    }))
  }, [members])

  const projectFilterOptions = useMemo<MultiSelectOption[]>(
    () => projects.map((project) => ({ value: project.id, label: project.title })),
    [projects]
  )

  const statusFilterOptions = useMemo<MultiSelectOption[]>(
    () => [
      { value: 'todo', label: t('kanban.todo') },
      { value: 'in_progress', label: t('kanban.inProgress') },
      { value: 'done', label: t('kanban.done') },
    ],
    [t]
  )

  const priorityFilterOptions = useMemo<MultiSelectOption[]>(
    () => [
      { value: 'low', label: t('common.low') },
      { value: 'medium', label: t('common.medium') },
      { value: 'high', label: t('common.high') },
    ],
    [t]
  )

  const assigneeFilterOptions = useMemo<MultiSelectOption[]>(
    () => [
      { value: '__none__', label: t('common.none') },
      ...memberOptions.map((member) => ({
        value: member.id,
        label: member.full_name || member.email,
      })),
    ],
    [memberOptions, t]
  )

  const responsibleFilterOptions = useMemo<MultiSelectOption[]>(
    () => [
      { value: '__none__', label: t('common.none') },
      ...memberOptions.map((member) => ({
        value: member.id,
        label: member.full_name || member.email,
      })),
    ],
    [memberOptions, t]
  )

  const getMemberById = (memberId: string | null | undefined): MemberOption | null => {
    if (!memberId) return null
    const member = memberOptions.find((m) => m.id === memberId)
    return member || null
  }

  const handleTaskCreated = (newTask: TaskItem) => {
    const relatedProject = projects.find((project) => project.id === newTask.project_id)
    const enrichedTask: TaskItem = {
      ...newTask,
      project: relatedProject
        ? {
            id: relatedProject.id,
            title: relatedProject.title,
            color: relatedProject.color,
            status: 'active',
          }
        : null,
      assignee: getMemberById(newTask.assignee_id),
      responsible: getMemberById(newTask.responsible_id),
    }

    setTasks((prev) => sortByUpdatedAtDesc([enrichedTask, ...prev]))
  }

  const handleTaskUpdated = (updatedTask: Partial<TaskItem> & { id: string }) => {
    setTasks((prev) =>
      sortByUpdatedAtDesc(
        prev.map((task) => {
          if (task.id !== updatedTask.id) return task

          return {
            ...task,
            ...updatedTask,
            project: updatedTask.project || task.project,
            assignee:
              updatedTask.assignee !== undefined
                ? updatedTask.assignee
                : getMemberById(updatedTask.assignee_id) || task.assignee || null,
            responsible:
              updatedTask.responsible !== undefined
                ? updatedTask.responsible
                : getMemberById(updatedTask.responsible_id) || task.responsible || null,
          }
        })
      )
    )
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((item) => item.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = tasks.find((item) => item.id === activeId)
    if (!activeItem) return

    if (overId !== 'todo' && overId !== 'in_progress' && overId !== 'done') {
      const overItem = tasks.find((item) => item.id === overId)
      if (!overItem || activeItem.status === overItem.status) return

      setTasks((prev) =>
        prev.map((item) =>
          item.id === activeId
            ? {
                ...item,
                status: overItem.status,
                progress: overItem.status === 'done' ? 100 : item.progress,
              }
            : item
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const currentTask = tasks.find((item) => item.id === activeId)
    if (!currentTask) return

    const targetStatus = overId === 'todo' || overId === 'in_progress' || overId === 'done'
      ? overId
      : tasks.find((item) => item.id === overId)?.status

    if (!targetStatus || currentTask.status === targetStatus) return

    const optimisticTask: TaskItem = {
      ...currentTask,
      status: targetStatus,
      progress: targetStatus === 'done' ? 100 : currentTask.progress,
    }

    setTasks((prev) => prev.map((item) => (item.id === activeId ? optimisticTask : item)))

    try {
      await updateTaskStatus(activeId, targetStatus)
      await logActivity(
        userId,
        currentTask.project_id,
        currentTask.id,
        targetStatus === 'done' ? 'task_completed' : 'task_status_changed',
        {
          old_status: currentTask.status,
          new_status: targetStatus,
          task_title: currentTask.title,
        }
      )
      toast.success(t('tasks.taskMarkedAsComplete'))
    } catch (error) {
      console.error('Failed to update task status:', error)
      setTasks((prev) => prev.map((item) => (item.id === activeId ? currentTask : item)))
      toast.error(t('tasks.failedToUpdateTask'))
    }
  }

  const handleInlineStatusChange = async (task: TaskItem, status: 'todo' | 'in_progress' | 'done') => {
    if (task.status === status) return

    const previous = task
    const optimistic = {
      ...task,
      status,
      progress: status === 'done' ? 100 : task.progress,
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? optimistic : item)))

    try {
      await updateTaskStatus(task.id, status)
      await logActivity(
        userId,
        task.project_id,
        task.id,
        status === 'done' ? 'task_completed' : 'task_status_changed',
        {
          old_status: previous.status,
          new_status: status,
          task_title: task.title,
        }
      )
      toast.success(t('tasks.taskUpdatedSuccessfully'))
    } catch (error) {
      console.error('Failed to update task status:', error)
      setTasks((prev) => prev.map((item) => (item.id === task.id ? previous : item)))
      toast.error(t('tasks.failedToUpdateTask'))
    }
  }

  const handleInlineUpdate = async (
    task: TaskItem,
    updates: Partial<Pick<TaskItem, 'priority' | 'assignee_id' | 'responsible_id' | 'estimated_duration'>>
  ) => {
    const previous = task
    const optimistic: TaskItem = {
      ...task,
      ...updates,
      assignee: updates.assignee_id !== undefined ? getMemberById(updates.assignee_id) : task.assignee || null,
      responsible: updates.responsible_id !== undefined ? getMemberById(updates.responsible_id) : task.responsible || null,
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? optimistic : item)))

    try {
      const updated = await updateTask(task.id, updates)
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
                ...item,
                ...updated,
                project: item.project,
                assignee: getMemberById(updated.assignee_id),
                responsible: getMemberById(updated.responsible_id),
              }
            : item
        )
      )
      toast.success(t('tasks.taskUpdatedSuccessfully'))
    } catch (error) {
      console.error('Failed to update task:', error)
      setTasks((prev) => prev.map((item) => (item.id === task.id ? previous : item)))
      toast.error(t('tasks.failedToUpdateTask'))
    }
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t('nav.kanban')}</h1>
          <p className="text-sm text-muted-foreground">{t('kanban.globalDescription')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isPremium ? (
            <Button variant="outline" size="sm" onClick={() => setIsAICreateDialogOpen(true)}>
              <Sparkles className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('kanban.createTasksWithAI')}</span>
              <span className="sm:hidden">AI</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setUpgradeDialogOpen(true)}>
              <Sparkles className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('kanban.createTasksWithAI')}</span>
              <span className="sm:hidden">AI</span>
            </Button>
          )}
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 sm:mr-2" />
            {t('tasks.newTask')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="lg:col-span-2"
        />

        <MultiSelectFilter
          label={t('tasks.project')}
          options={projectFilterOptions}
          selectedValues={selectedProjectIds}
          onChange={setSelectedProjectIds}
          selectAllLabel={t('kanban.selectAll')}
          clearLabel={t('kanban.deselectAll')}
        />

        <MultiSelectFilter
          label={t('tasks.status')}
          options={statusFilterOptions}
          selectedValues={selectedStatuses}
          onChange={setSelectedStatuses}
          selectAllLabel={t('kanban.selectAll')}
          clearLabel={t('kanban.deselectAll')}
        />

        <MultiSelectFilter
          label={t('tasks.priority')}
          options={priorityFilterOptions}
          selectedValues={selectedPriorities}
          onChange={setSelectedPriorities}
          selectAllLabel={t('kanban.selectAll')}
          clearLabel={t('kanban.deselectAll')}
        />

        <MultiSelectFilter
          label={t('tasks.assignee')}
          options={assigneeFilterOptions}
          selectedValues={selectedAssigneeIds}
          onChange={setSelectedAssigneeIds}
          selectAllLabel={t('kanban.selectAll')}
          clearLabel={t('kanban.deselectAll')}
        />

        <MultiSelectFilter
          label={t('tasks.responsible')}
          options={responsibleFilterOptions}
          selectedValues={selectedResponsibleIds}
          onChange={setSelectedResponsibleIds}
          selectAllLabel={t('kanban.selectAll')}
          clearLabel={t('kanban.deselectAll')}
        />
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-full grid-cols-2 sm:w-[320px]">
          <TabsTrigger value="kanban">{t('nav.kanban')}</TabsTrigger>
          <TabsTrigger value="list">{t('kanban.listView')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KanbanColumn
              title={t('kanban.todo')}
              status="todo"
              tasks={todoTasks}
              count={todoTasks.length}
              userId={userId}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
            <KanbanColumn
              title={t('kanban.inProgress')}
              status="in_progress"
              tasks={inProgressTasks}
              count={inProgressTasks.length}
              userId={userId}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
            <KanbanColumn
              title={t('kanban.done')}
              status="done"
              tasks={doneTasks}
              count={doneTasks.length}
              userId={userId}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-lg opacity-95 cursor-grabbing max-w-[320px]">
                <h4 className="font-semibold text-sm dark:text-gray-200">{activeTask.title}</h4>
                {activeTask.project?.title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activeTask.project.title}</p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="rounded-lg border bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('title')}>
                      {t('tasks.taskTitle')} <span className="text-xs opacity-70">{getSortIndicator('title')}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('project')}>
                      {t('tasks.project')} <span className="text-xs opacity-70">{getSortIndicator('project')}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                      {t('tasks.status')} <span className="text-xs opacity-70">{getSortIndicator('status')}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('priority')}>
                      {t('tasks.priority')} <span className="text-xs opacity-70">{getSortIndicator('priority')}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('assignee')}>
                      {t('tasks.assignee')} <span className="text-xs opacity-70">{getSortIndicator('assignee')}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('responsible')}>
                      {t('tasks.responsible')} <span className="text-xs opacity-70">{getSortIndicator('responsible')}</span>
                    </button>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('estimated_duration')}>
                      {t('tasks.estimatedTime')} <span className="text-xs opacity-70">{getSortIndicator('estimated_duration')}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedListTasks.map((task) => (
                  <tr key={task.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 min-w-[220px]">
                      <button
                        className="text-left hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[260px]"
                        onClick={() => setSelectedTask(task)}
                      >
                        {task.title}
                      </button>
                    </td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: task.project?.color || '#94a3b8' }}
                        />
                        <span className="truncate max-w-[180px]">{task.project?.title || '-'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 min-w-[160px]">
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleInlineStatusChange(task, value as 'todo' | 'in_progress' | 'done')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">{t('kanban.todo')}</SelectItem>
                          <SelectItem value="in_progress">{t('kanban.inProgress')}</SelectItem>
                          <SelectItem value="done">{t('kanban.done')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <Select
                        value={task.priority}
                        onValueChange={(value) => handleInlineUpdate(task, { priority: value as 'low' | 'medium' | 'high' })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('common.low')}</SelectItem>
                          <SelectItem value="medium">{t('common.medium')}</SelectItem>
                          <SelectItem value="high">{t('common.high')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 min-w-[180px]">
                      <Select
                        value={task.assignee_id || 'none'}
                        onValueChange={(value) => handleInlineUpdate(task, { assignee_id: value === 'none' ? null : value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('common.none')}</SelectItem>
                          {memberOptions.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 min-w-[180px]">
                      <Select
                        value={task.responsible_id || 'none'}
                        onValueChange={(value) => handleInlineUpdate(task, { responsible_id: value === 'none' ? null : value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('common.none')}</SelectItem>
                          {memberOptions.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 min-w-[120px]">
                      <Input
                        type="number"
                        min={0}
                        defaultValue={task.estimated_duration || ''}
                        placeholder="-"
                        onBlur={(event) => {
                          const raw = event.target.value.trim()
                          const parsed = raw === '' ? null : Number(raw)
                          if ((task.estimated_duration || null) === (Number.isNaN(parsed) ? null : parsed)) return
                          handleInlineUpdate(task, {
                            estimated_duration: Number.isNaN(parsed) ? null : parsed,
                          })
                        }}
                        className="w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedListTasks.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('common.noResults')}
            </div>
          )}
        </div>
      )}

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={userId}
        companyId={companyId}
        projects={projects}
        onTaskCreated={handleTaskCreated}
      />

      <AICreateTasksDialog
        open={isAICreateDialogOpen}
        onOpenChange={setIsAICreateDialogOpen}
        projects={projects}
        userId={userId}
        onTasksCreated={(newTasks) => {
          const enrichedTasks = newTasks.map((task) => ({
            ...task,
            project: projects.find((project) => project.id === task.project_id)
              ? {
                  id: task.project_id,
                  title: projects.find((project) => project.id === task.project_id)?.title || '',
                  color: projects.find((project) => project.id === task.project_id)?.color || '#3b82f6',
                  status: 'active',
                }
              : null,
            assignee: getMemberById(task.assignee_id),
            responsible: getMemberById(task.responsible_id),
          }))
          setTasks((prev) => sortByUpdatedAtDesc([...enrichedTasks as TaskItem[], ...prev]))
        }}
      />

      <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} feature={t('kanban.aiTaskFeatures')} />

      {selectedTask && (
        <EditTaskDialog
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTask(null)
            }
          }}
          task={selectedTask}
          onTaskUpdated={(updatedTask) => {
            handleTaskUpdated(updatedTask as TaskItem)
            setSelectedTask((prev) => (prev ? { ...prev, ...updatedTask } : prev))
          }}
          companyId={companyId}
          userId={userId}
        />
      )}
    </div>
  )
}
