'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, Upload, FileText, History, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import {
  exportAllData,
  exportAnalyticsToCSV,
  getExportHistory,
} from '@/lib/utils/export'
import {
  importFromFile,
  validateExportData,
  parseJSONFile,
  prepareImportData,
  mapProjectIds,
} from '@/lib/utils/import'
import { getProjects } from '@/lib/supabase/queries/projects'
import { getTasks } from '@/lib/supabase/queries/tasks'
import { getNotes } from '@/lib/supabase/queries/notes'
import { createProject } from '@/lib/supabase/queries/projects'
import { createTasks } from '@/lib/supabase/queries/tasks'
import { createNote } from '@/lib/supabase/queries/notes'
import type { ExportData } from '@/lib/utils/export'

interface DataExportImportProps {
  userId: string
}

export function DataExportImport({ userId }: DataExportImportProps) {
  const router = useRouter()
  const t = useTranslation()
  const { isPremium } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeProjects: true,
    includeTasks: true,
    includeNotes: true,
    includeTimeEntries: false,
  })
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exportHistory, setExportHistory] = useState(getExportHistory())

  const handleExport = async () => {
    if (!isPremium) {
      setUpgradeDialogOpen(true)
      return
    }

    setExporting(true)
    try {
      const [projects, notes] = await Promise.all([
        getProjects(userId),
        getNotes(userId),
      ])

      // Get all tasks from all projects
      const allTasks = []
      for (const project of projects || []) {
        const tasks = await getTasks(project.id)
        if (tasks) {
          allTasks.push(...tasks)
        }
      }

      await exportAllData(
        projects || [],
        allTasks,
        notes || [],
        undefined,
        exportOptions
      )

      toast.success('Data exported successfully')
      setExportHistory(getExportHistory())
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    if (!isPremium) {
      setUpgradeDialogOpen(true)
      return
    }

    setExporting(true)
    try {
      const projects = await getProjects(userId)
      const allTasks = []
      for (const project of projects || []) {
        const tasks = await getTasks(project.id)
        if (tasks) {
          allTasks.push(...tasks)
        }
      }

      await exportAnalyticsToCSV(allTasks, projects || [])
      toast.success('Analytics exported to CSV')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const result = await importFromFile(file, userId)

      if (!result.success) {
        toast.error(`Import failed: ${result.errors.join(', ')}`)
        return
      }

      // Parse file again to get full data
      const data = await parseJSONFile(file)
      if (!validateExportData(data)) {
        toast.error('Invalid export file')
        return
      }

      // Prepare import data
      const { projects, tasks, notes, errors } = prepareImportData(data, userId)

      if (errors.length > 0) {
        toast.warning(`Import completed with ${errors.length} errors`)
      }

      // Import projects first
      const newProjectIds: string[] = []
      const oldProjectIds: string[] = []

      for (const project of projects) {
        try {
          const newProject = await createProject(project)
          newProjectIds.push(newProject.id)
          oldProjectIds.push(data.projects.find(p => p.title === project.title)?.id || '')
        } catch (error: any) {
          console.error('Failed to import project:', error)
        }
      }

      // Map project IDs for tasks
      const mappedTasks = mapProjectIds(tasks, oldProjectIds, newProjectIds)

      // Import tasks
      if (mappedTasks.length > 0) {
        try {
          await createTasks(mappedTasks)
        } catch (error: any) {
          console.error('Failed to import tasks:', error)
        }
      }

      // Import notes
      for (const note of notes) {
        try {
          await createNote(note)
        } catch (error: any) {
          console.error('Failed to import note:', error)
        }
      }

      toast.success(
        `Imported ${result.imported.projects} projects, ${result.imported.tasks} tasks, ${result.imported.notes} notes`
      )

      // Refresh page to show imported data
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to import data')
    } finally {
      setImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold">Data Export & Import</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Export your data for backup or import previously exported data
        </p>
      </div>

      {/* Export Section */}
      <div className="space-y-4 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h4 className="font-medium mb-3">Export Data</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-projects"
                checked={exportOptions.includeProjects}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includeProjects: !!checked })
                }
              />
              <Label htmlFor="export-projects">Include Projects</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-tasks"
                checked={exportOptions.includeTasks}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includeTasks: !!checked })
                }
              />
              <Label htmlFor="export-tasks">Include Tasks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-notes"
                checked={exportOptions.includeNotes}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includeNotes: !!checked })
                }
              />
              <Label htmlFor="export-notes">Include Notes</Label>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button onClick={handleExport} disabled={exporting} className="flex-1 sm:flex-initial">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export JSON'}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={exporting} className="flex-1 sm:flex-initial">
              <FileText className="w-4 h-4 mr-2" />
              Export Analytics CSV
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h4 className="font-medium mb-3">Import Data</h4>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Warning:</strong> Importing data will add new items to your account.
                  This will not delete existing data, but duplicate items may be created.
                </p>
              </div>
            </div>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
              disabled={importing}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Import JSON'}
            </Button>
          </div>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Export History
            </h4>
            <div className="space-y-2">
              {exportHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <div>
                    <p className="text-sm font-medium">{item.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.metadata.totalProjects} projects, {item.metadata.totalTasks} tasks,{' '}
                    {item.metadata.totalNotes} notes
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Share & Export"
      />
    </div>
  )
}

