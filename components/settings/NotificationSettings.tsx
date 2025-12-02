'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Bell, BellOff } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { toast } from 'sonner'

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const {
    permission,
    preferences,
    supported,
    requestPermission,
    updatePreferences,
    sendNotification,
  } = useNotifications(userId)

  const [localPreferences, setLocalPreferences] = useState(preferences)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handleRequestPermission = async () => {
    const result = await requestPermission()
    if (result.granted) {
      toast.success('Notification permission granted')
    } else if (result.denied) {
      toast.error('Notification permission denied. Please enable it in your browser settings.')
    }
  }

  const handlePreferenceChange = (key: keyof typeof localPreferences, value: any) => {
    const updated = { ...localPreferences, [key]: value }
    setLocalPreferences(updated)
    updatePreferences(updated)
  }

  const handleQuietHoursChange = (key: 'start' | 'end', value: string) => {
    const updated = {
      ...localPreferences,
      quietHours: {
        ...localPreferences.quietHours,
        [key]: value,
      },
    }
    setLocalPreferences(updated)
    updatePreferences(updated)
  }

  const handleTestNotification = () => {
    sendNotification('Test Notification', {
      body: 'This is a test notification from Devlogify',
    })
    toast.success('Test notification sent')
  }

  if (!supported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Notifications are not supported in this browser.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure browser and in-app notifications
        </p>
      </div>

      {/* Permission */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div>
            <p className="font-medium">Browser Notifications</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {permission.granted
                ? 'Permission granted'
                : permission.denied
                ? 'Permission denied'
                : 'Permission not requested'}
            </p>
          </div>
          {!permission.granted && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestPermission}
              disabled={permission.denied}
            >
              {permission.denied ? 'Denied' : 'Request Permission'}
            </Button>
          )}
        </div>

        {/* Enable Notifications */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {localPreferences.enabled ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <Label htmlFor="enable-notifications">Enable Notifications</Label>
              <p className="text-xs text-gray-500">Turn on all notifications</p>
            </div>
          </div>
          <Switch
            id="enable-notifications"
            checked={localPreferences.enabled}
            onCheckedChange={(checked) => {
              if (checked && !permission.granted) {
                handleRequestPermission()
              }
              handlePreferenceChange('enabled', checked)
            }}
            disabled={!permission.granted && permission.denied}
          />
        </div>

        {/* Notification Types */}
        {localPreferences.enabled && permission.granted && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <Label>Task Reminders</Label>
                <p className="text-xs text-gray-500">Remind about long-running tasks</p>
              </div>
              <Switch
                checked={localPreferences.taskReminders}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('taskReminders', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Summary</Label>
                <p className="text-xs text-gray-500">Daily productivity summary</p>
              </div>
              <Switch
                checked={localPreferences.dailySummary}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('dailySummary', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Summary</Label>
                <p className="text-xs text-gray-500">Weekly productivity summary</p>
              </div>
              <Switch
                checked={localPreferences.weeklySummary}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('weeklySummary', checked)
                }
              />
            </div>
          </div>
        )}

        {/* Quiet Hours */}
        {localPreferences.enabled && permission.granted && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <Label>Quiet Hours</Label>
                <p className="text-xs text-gray-500">Disable notifications during these hours</p>
              </div>
              <Switch
                checked={localPreferences.quietHours.enabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('quietHours', {
                    ...localPreferences.quietHours,
                    enabled: checked,
                  })
                }
              />
            </div>

            {localPreferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={localPreferences.quietHours.start}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={localPreferences.quietHours.end}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test Notification */}
        {localPreferences.enabled && permission.granted && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}
      </div>
    </div>
  )
}

