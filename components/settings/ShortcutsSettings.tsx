'use client'

import { useState } from 'react'
import { useShortcutsStore } from '@/lib/store/shortcutsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Keyboard, RotateCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useConfirmModal } from '@/lib/hooks/useConfirmModal'

function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'Meta': '⌘',
    'Control': 'Ctrl',
    'Shift': '⇧',
    'Alt': '⌥',
    'Escape': 'Esc',
    'Enter': '↵',
    'Backspace': '⌫',
    'Delete': '⌦',
  }
  return keyMap[key] || key.toUpperCase()
}

export function ShortcutsSettings() {
  const t = useTranslation()
  const { shortcuts, customBindings, setShortcut, resetShortcut, resetAll, getShortcutKeys } = useShortcutsStore()
  const { confirm, confirmWithAction, Modal: ConfirmModal } = useConfirmModal()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingKeys, setEditingKeys] = useState<string[]>([])

  const handleStartEdit = (id: string) => {
    setEditingId(id)
    setEditingKeys(getShortcutKeys(id))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingKeys([])
  }

  const handleSave = (id: string) => {
    if (editingKeys.length === 0) {
      toast.error(t('settings.pleaseEnterAtLeastOneKey'))
      return
    }
    
    // Validate keys
    const validKeys = editingKeys.filter(k => k.trim() !== '')
    if (validKeys.length === 0) {
      toast.error(t('settings.pleaseEnterValidKeys'))
      return
    }

    setShortcut(id, validKeys)
    setEditingId(null)
    setEditingKeys([])
    toast.success(t('settings.shortcutUpdated'))
  }

  const handleKeyCapture = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const key = e.key
    const isModifier = ['Meta', 'Control', 'Shift', 'Alt'].includes(key)
    
    if (isModifier && index === 0) {
      const newKeys = [...editingKeys]
      newKeys[0] = key
      if (newKeys.length === 1) {
        newKeys.push('')
      }
      setEditingKeys(newKeys)
    } else if (!isModifier && index === 1) {
      const newKeys = [...editingKeys]
      newKeys[1] = key
      setEditingKeys(newKeys)
    }
  }

  const handleReset = (id: string) => {
    resetShortcut(id)
    toast.success(t('settings.shortcutResetToDefault'))
  }

  const handleResetAll = async () => {
    const confirmed = await confirm({
      title: t('settings.resetAllShortcuts'),
      description: t('settings.resetAllShortcutsDescription'),
      confirmText: t('settings.resetAll'),
      cancelText: t('common.cancel'),
      variant: 'warning',
    })

    if (!confirmed) return

    resetAll()
    toast.success(t('settings.allShortcutsResetToDefaults'))
  }

  const categories = ['global', 'navigation', 'task', 'editor'] as const
  const categoryLabels: Record<string, string> = {
    global: t('settings.globalShortcuts'),
    navigation: t('settings.navigation'),
    task: t('settings.taskManagement'),
    editor: t('settings.editor'),
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold">{t('settings.keyboardShortcuts')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('settings.customizeKeyboardShortcuts')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetAll} className="w-full sm:w-auto">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('settings.resetAll')}
        </Button>
      </div>

      {categories.map((category) => {
        const categoryShortcuts = shortcuts.filter((s) => s.category === category)
        if (categoryShortcuts.length === 0) return null

        return (
          <div key={category} className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              {categoryLabels[category] || category}
            </h4>
            <div className="space-y-2">
              {categoryShortcuts.map((shortcut) => {
                const keys = getShortcutKeys(shortcut.id)
                const isEditing = editingId === shortcut.id
                const hasCustom = customBindings[shortcut.id] !== undefined

                return (
                  <div
                    key={shortcut.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium">{shortcut.description}</Label>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={editingKeys[0] || ''}
                              placeholder={t('settings.modifier')}
                              onKeyDown={(e) => handleKeyCapture(e, 0)}
                              className="w-20 sm:w-24"
                              readOnly
                            />
                            <span className="text-gray-400">+</span>
                            <Input
                              type="text"
                              value={editingKeys[1] || ''}
                              placeholder={t('settings.key')}
                              onKeyDown={(e) => handleKeyCapture(e, 1)}
                              className="w-20 sm:w-24"
                              readOnly
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(shortcut.id)}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            {t('common.cancel')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 flex-wrap">
                            {keys.map((key, keyIndex) => (
                              <span key={keyIndex}>
                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                                  {formatKey(key)}
                                </kbd>
                                {keyIndex < keys.length - 1 && (
                                  <span className="mx-1 text-gray-400">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(shortcut.id)}
                          >
                            <Keyboard className="w-4 h-4" />
                          </Button>
                          {hasCustom && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReset(shortcut.id)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>{t('settings.tip')}:</strong> {t('settings.shortcutTip')}
        </p>
      </div>
      {ConfirmModal}
    </div>
  )
}

