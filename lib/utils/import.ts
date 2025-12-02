/**
 * Import utilities for data import functionality
 */

import type { ExportData } from './export'
import type { ProjectInsert } from '@/lib/supabase/queries/projects'
import type { TaskInsert } from '@/lib/supabase/queries/tasks'
import type { NoteInsert } from '@/lib/supabase/queries/notes'

export interface ImportResult {
  success: boolean
  imported: {
    projects: number
    tasks: number
    notes: number
  }
  errors: string[]
}

/**
 * Validate export data structure
 */
export function validateExportData(data: any): data is ExportData {
  if (!data || typeof data !== 'object') {
    return false
  }

  if (!data.metadata || typeof data.metadata !== 'object') {
    return false
  }

  if (!Array.isArray(data.projects)) {
    return false
  }

  if (!Array.isArray(data.tasks)) {
    return false
  }

  if (!Array.isArray(data.notes)) {
    return false
  }

  return true
}

/**
 * Parse JSON file
 */
export function parseJSONFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsText(file)
  })
}

/**
 * Validate and prepare import data
 */
export function prepareImportData(
  data: ExportData,
  userId: string
): {
  projects: ProjectInsert[]
  tasks: TaskInsert[]
  notes: NoteInsert[]
  errors: string[]
} {
  const errors: string[] = []
  const projects: ProjectInsert[] = []
  const tasks: TaskInsert[] = []
  const notes: NoteInsert[] = []

  // Import projects
  data.projects.forEach((project, index) => {
    try {
      if (!project.title) {
        errors.push(`Project ${index + 1}: Missing title`)
        return
      }

      projects.push({
        user_id: userId,
        title: project.title,
        description: project.description || null,
        color: project.color || '#3b82f6',
        status: project.status || 'active',
        is_pinned: project.is_pinned || false,
      })
    } catch (error: any) {
      errors.push(`Project ${index + 1}: ${error.message}`)
    }
  })

  // Import tasks (project_id will be mapped using mapProjectIds function after projects are imported)
  data.tasks.forEach((task, index) => {
    try {
      if (!task.title) {
        errors.push(`Task ${index + 1}: Missing title`)
        return
      }

      // Note: project_id will be mapped using mapProjectIds function after projects are imported
      tasks.push({
        project_id: task.project_id, // Will be mapped using mapProjectIds function
        user_id: userId,
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        estimated_duration: task.estimated_duration || null,
        actual_duration: task.actual_duration || 0,
        progress: task.progress || 0,
        order_index: task.order_index || 0,
        tags: task.tags || null,
        completed_at: task.completed_at || null,
      })
    } catch (error: any) {
      errors.push(`Task ${index + 1}: ${error.message}`)
    }
  })

  // Import notes
  data.notes.forEach((note, index) => {
    try {
      if (!note.content) {
        errors.push(`Note ${index + 1}: Missing content`)
        return
      }

      notes.push({
        user_id: userId,
        title: note.title || null,
        content: note.content,
        tags: note.tags || null,
        project_id: note.project_id || null,
        is_pinned: note.is_pinned || false,
      })
    } catch (error: any) {
      errors.push(`Note ${index + 1}: ${error.message}`)
    }
  })

  return { projects, tasks, notes, errors }
}

/**
 * Map project IDs for tasks after import
 */
export function mapProjectIds(
  tasks: TaskInsert[],
  oldProjectIds: string[],
  newProjectIds: string[]
): TaskInsert[] {
  const idMap = new Map<string, string>()
  oldProjectIds.forEach((oldId, index) => {
    idMap.set(oldId, newProjectIds[index])
  })

  return tasks.map((task) => {
    if (task.project_id && idMap.has(task.project_id)) {
      return {
        ...task,
        project_id: idMap.get(task.project_id)!,
      }
    }
    return task
  })
}

/**
 * Import data from file
 */
export async function importFromFile(
  file: File,
  userId: string
): Promise<ImportResult> {
  try {
    // Parse file
    const data = await parseJSONFile(file)

    // Validate structure
    if (!validateExportData(data)) {
      return {
        success: false,
        imported: { projects: 0, tasks: 0, notes: 0 },
        errors: ['Invalid export file format'],
      }
    }

    // Prepare import data
    const { projects, tasks, notes, errors } = prepareImportData(data, userId)

    return {
      success: errors.length === 0,
      imported: {
        projects: projects.length,
        tasks: tasks.length,
        notes: notes.length,
      },
      errors,
    }
  } catch (error: any) {
    return {
      success: false,
      imported: { projects: 0, tasks: 0, notes: 0 },
      errors: [error.message || 'Failed to import file'],
    }
  }
}

