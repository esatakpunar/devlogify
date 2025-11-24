'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePomodoroStore } from '@/lib/store/pomodoroStore'

interface PomodoroSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PomodoroSettings({ open, onOpenChange }: PomodoroSettingsProps) {
  const { settings, setSettings } = usePomodoroStore()
  const [formData, setFormData] = useState({
    workDuration: settings.workDuration.toString(),
    shortBreakDuration: settings.shortBreakDuration.toString(),
    longBreakDuration: settings.longBreakDuration.toString(),
    pomodorosUntilLongBreak: settings.pomodorosUntilLongBreak.toString(),
  })

  const handleSave = () => {
    setSettings({
      workDuration: parseInt(formData.workDuration),
      shortBreakDuration: parseInt(formData.shortBreakDuration),
      longBreakDuration: parseInt(formData.longBreakDuration),
      pomodorosUntilLongBreak: parseInt(formData.pomodorosUntilLongBreak),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
          <DialogDescription>
            Customize your Pomodoro timer durations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="workDuration">Work Duration (minutes)</Label>
            <Input
              id="workDuration"
              type="number"
              min="1"
              value={formData.workDuration}
              onChange={(e) => setFormData({ ...formData, workDuration: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="shortBreakDuration">Short Break (minutes)</Label>
            <Input
              id="shortBreakDuration"
              type="number"
              min="1"
              value={formData.shortBreakDuration}
              onChange={(e) => setFormData({ ...formData, shortBreakDuration: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="longBreakDuration">Long Break (minutes)</Label>
            <Input
              id="longBreakDuration"
              type="number"
              min="1"
              value={formData.longBreakDuration}
              onChange={(e) => setFormData({ ...formData, longBreakDuration: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="pomodorosUntilLongBreak">Pomodoros Until Long Break</Label>
            <Input
              id="pomodorosUntilLongBreak"
              type="number"
              min="1"
              value={formData.pomodorosUntilLongBreak}
              onChange={(e) => setFormData({ ...formData, pomodorosUntilLongBreak: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

