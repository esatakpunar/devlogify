'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'

interface AddManualTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  userId: string
  onTimeAdded: (minutes: number) => void
}

export function AddManualTimeDialog({ 
  open, 
  onOpenChange, 
  taskId,
  taskTitle,
  userId,
  onTimeAdded 
}: AddManualTimeDialogProps) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0')
    
    if (totalMinutes <= 0) {
      toast.error('Please enter a valid time')
      return
    }
  
    setLoading(true)
  
    try {
      const now = new Date()
      const startTime = new Date(now.getTime() - totalMinutes * 60000)
  
      // Time entry oluştur
      const { error: timeEntryError } = await supabase
        .from('time_entries')
        .insert({
          task_id: taskId,
          user_id: userId,
          started_at: startTime.toISOString(),
          ended_at: now.toISOString(),
          duration: totalMinutes,
          note: note || null,
          is_manual: true,
        })
  
      if (timeEntryError) throw timeEntryError
  
      // Task'ın actual_duration'ını güncelle
      const { data: task } = await supabase
        .from('tasks')
        .select('actual_duration, project_id')
        .eq('id', taskId)
        .single()
  
      if (task) {
        await supabase
          .from('tasks')
          .update({
            actual_duration: task.actual_duration + totalMinutes
          })
          .eq('id', taskId)
        
        // Activity log ekle
        await supabase
          .from('activity_logs')
          .insert({
            user_id: userId,
            project_id: task.project_id,
            task_id: taskId,
            action_type: 'time_logged',
            metadata: {
              duration: totalMinutes,
              task_title: taskTitle,
              is_manual: true
            }
          })
      }
  
      onTimeAdded(totalMinutes)
      toast.success('Time logged successfully', {
        description: `Added ${totalMinutes} minutes to "${taskTitle}"`,
      })
  
      // Reset form
      setHours('')
      setMinutes('')
      setNote('')
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to add time:', error)
      toast.error('Failed to log time')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Log Time Manually</DialogTitle>
          <DialogDescription>
            Add time spent on: <span className="font-medium text-gray-900">{taskTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                placeholder="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="What did you work on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              {loading ? 'Logging...' : 'Log Time'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}