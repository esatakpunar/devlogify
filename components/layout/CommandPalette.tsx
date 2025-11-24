'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { getProjects } from '@/lib/supabase/queries/projects'
import { getRecentIncompleteTasks } from '@/lib/supabase/queries/tasks'
import { getNotes } from '@/lib/supabase/queries/notes'
import { AICreateTasksDialog } from '@/components/tasks/AICreateTasksDialog'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { FolderKanban, FileText, CheckSquare, Sparkles, Plus, Search } from 'lucide-react'
import { usePremium } from '@/lib/hooks/usePremium'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function CommandPalette({ open, onOpenChange, userId }: CommandPaletteProps) {
  const { isPremium } = usePremium(userId)
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsData, tasksData, notesData] = await Promise.all([
        getProjects(userId, 'active'),
        getRecentIncompleteTasks(userId, 10),
        getNotes(userId),
      ])
      setProjects(projectsData || [])
      setTasks(tasksData || [])
      setNotes(notesData || [])
    } catch (error) {
      console.error('Failed to load command palette data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (value: string) => {
    onOpenChange(false)
    
    // Navigation
    if (value.startsWith('nav:')) {
      const path = value.replace('nav:', '')
      router.push(path)
      return
    }

    // Create actions
    if (value.startsWith('create:')) {
      const type = value.replace('create:', '')
      if (type === 'task') {
        // Open task creation - need project context
        router.push('/projects')
      } else if (type === 'note') {
        router.push('/notes')
      } else if (type === 'project') {
        router.push('/projects/new')
      } else if (type === 'ai-task') {
        // Open AI Create Tasks Dialog or Upgrade Dialog
        onOpenChange(false) // Close command palette first
        if (isPremium) {
          setAiDialogOpen(true)
        } else {
          setUpgradeDialogOpen(true)
        }
      }
      return
    }

    // Open project
    if (value.startsWith('project:')) {
      const projectId = value.replace('project:', '')
      router.push(`/projects/${projectId}`)
      return
    }

    // Open task
    if (value.startsWith('task:')) {
      const taskId = value.replace('task:', '')
      const task = tasks.find(t => t.id === taskId)
      if (task?.project_id) {
        router.push(`/projects/${task.project_id}`)
      }
      return
    }

    // Open note
    if (value.startsWith('note:')) {
      router.push('/notes')
      return
    }
  }

  return (
    <>
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        {loading && (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading...
          </div>
        )}
        
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem value="create:ai-task" onSelect={handleSelect}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Create Tasks with AI</span>
          </CommandItem>
          <CommandItem value="create:task" onSelect={handleSelect}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Task</span>
          </CommandItem>
          <CommandItem value="create:note" onSelect={handleSelect}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Create New Note</span>
          </CommandItem>
          <CommandItem value="create:project" onSelect={handleSelect}>
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Create New Project</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem value="nav:/dashboard" onSelect={handleSelect}>
            <Search className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem value="nav:/projects" onSelect={handleSelect}>
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>Go to Projects</span>
          </CommandItem>
          <CommandItem value="nav:/notes" onSelect={handleSelect}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Go to Notes</span>
          </CommandItem>
          <CommandItem value="nav:/analytics" onSelect={handleSelect}>
            <Search className="mr-2 h-4 w-4" />
            <span>Go to Analytics</span>
          </CommandItem>
          <CommandItem value="nav:/timeline" onSelect={handleSelect}>
            <Search className="mr-2 h-4 w-4" />
            <span>Go to Timeline</span>
          </CommandItem>
          <CommandItem value="nav:/settings" onSelect={handleSelect}>
            <Search className="mr-2 h-4 w-4" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project:${project.id}`}
                  onSelect={handleSelect}
                >
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Tasks">
              {tasks.slice(0, 5).map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task:${task.id}`}
                  onSelect={handleSelect}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  <span>{task.title}</span>
                  {task.project && (
                    <span className="ml-2 text-xs text-gray-500">
                      {task.project.title}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Notes">
              {notes.slice(0, 5).map((note) => (
                <CommandItem
                  key={note.id}
                  value={`note:${note.id}`}
                  onSelect={handleSelect}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{note.title || 'Untitled Note'}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
    
    {/* AI Create Tasks Dialog - Outside CommandDialog to avoid nested dialogs */}
    {isPremium && (
      <AICreateTasksDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        projects={projects}
        userId={userId}
        onTasksCreated={() => {
          // Reload data after tasks are created
          loadData()
        }}
      />
    )}

    {/* Upgrade Dialog */}
    <UpgradeDialog
      open={upgradeDialogOpen}
      onOpenChange={setUpgradeDialogOpen}
      feature="AI Task Creation"
    />
  </>
  )
}

