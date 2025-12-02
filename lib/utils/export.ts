/**
 * Export utilities for data export functionality
 */

import type { Project } from '@/lib/supabase/queries/projects'
import type { Task } from '@/lib/supabase/queries/tasks'
import type { Note } from '@/lib/supabase/queries/notes'

export interface ExportData {
  projects: Project[]
  tasks: Task[]
  notes: Note[]
  timeEntries?: any[]
  metadata: {
    exportDate: string
    version: string
    totalProjects: number
    totalTasks: number
    totalNotes: number
  }
}

export interface ExportOptions {
  includeProjects?: boolean
  includeTasks?: boolean
  includeNotes?: boolean
  includeTimeEntries?: boolean
  format: 'json' | 'csv'
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Export analytics data to CSV
 */
export function exportToCSV(data: {
  tasks: Task[]
  projects: Project[]
}): string {
  const rows: string[] = []
  
  // CSV Header
  rows.push('Type,ID,Title,Status,Priority,Project,Estimated Duration,Actual Duration,Created At,Completed At')
  
  // Tasks
  data.tasks.forEach((task) => {
    const project = data.projects.find(p => p.id === task.project_id)
    const row = [
      'Task',
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      project?.title || '',
      task.estimated_duration?.toString() || '',
      task.actual_duration?.toString() || '',
      task.created_at,
      task.completed_at || '',
    ].join(',')
    rows.push(row)
  })
  
  return rows.join('\n')
}

/**
 * Download file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Prepare export data
 */
export function prepareExportData(
  projects: Project[],
  tasks: Task[],
  notes: Note[],
  timeEntries?: any[],
  options?: Partial<ExportOptions>
): ExportData {
  const opts: ExportOptions = {
    includeProjects: true,
    includeTasks: true,
    includeNotes: true,
    includeTimeEntries: false,
    format: 'json',
    ...options,
  }

  return {
    projects: opts.includeProjects ? projects : [],
    tasks: opts.includeTasks ? tasks : [],
    notes: opts.includeNotes ? notes : [],
    timeEntries: opts.includeTimeEntries ? timeEntries : [],
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      totalProjects: opts.includeProjects ? projects.length : 0,
      totalTasks: opts.includeTasks ? tasks.length : 0,
      totalNotes: opts.includeNotes ? notes.length : 0,
    },
  }
}

/**
 * Export all data
 */
export async function exportAllData(
  projects: Project[],
  tasks: Task[],
  notes: Note[],
  timeEntries?: any[],
  options?: Partial<ExportOptions>
): Promise<void> {
  const data = prepareExportData(projects, tasks, notes, timeEntries, options)
  const json = exportToJSON(data)
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `devlogify-export-${timestamp}.json`
  downloadFile(json, filename, 'application/json')
  
  // Save export history
  saveExportHistory(filename, data.metadata)
}

/**
 * Export analytics to CSV
 */
export async function exportAnalyticsToCSV(
  tasks: Task[],
  projects: Project[]
): Promise<void> {
  const csv = exportToCSV({ tasks, projects })
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `devlogify-analytics-${timestamp}.csv`
  downloadFile(csv, filename, 'text/csv')
}

/**
 * Save export history to localStorage
 */
function saveExportHistory(filename: string, metadata: ExportData['metadata']): void {
  try {
    const history = getExportHistory()
    history.push({
      filename,
      date: new Date().toISOString(),
      metadata,
    })
    // Keep only last 10 exports
    const recent = history.slice(-10)
    localStorage.setItem('devlogify-export-history', JSON.stringify(recent))
  } catch (error) {
    console.error('Failed to save export history:', error)
  }
}

/**
 * Get export history
 */
export function getExportHistory(): Array<{
  filename: string
  date: string
  metadata: ExportData['metadata']
}> {
  try {
    const history = localStorage.getItem('devlogify-export-history')
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Failed to get export history:', error)
    return []
  }
}

