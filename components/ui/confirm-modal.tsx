'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Info, Trash2, Archive, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

export type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'info'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

const variantConfig: Record<ConfirmVariant, { icon: React.ReactNode; iconColor: string; buttonVariant: string }> = {
  default: {
    icon: <Info className="w-5 h-5" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'default',
  },
  destructive: {
    icon: <Trash2 className="w-5 h-5" />,
    iconColor: 'text-red-600 dark:text-red-400',
    buttonVariant: 'destructive',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonVariant: 'default',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonVariant: 'default',
  },
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmModalProps) {
  const t = useTranslation()
  const config = variantConfig[variant]
  
  // Use translations if not provided
  const finalConfirmText = confirmText || t('common.confirm')
  const finalCancelText = cancelText || t('common.cancel')

  const handleConfirm = async () => {
    await onConfirm()
  }

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              variant === 'destructive' && 'bg-red-50 dark:bg-red-900/20',
              variant === 'warning' && 'bg-amber-50 dark:bg-amber-900/20',
              variant === 'info' && 'bg-blue-50 dark:bg-blue-900/20',
              variant === 'default' && 'bg-gray-50 dark:bg-gray-800'
            )}>
              <div className={config.iconColor}>
                {config.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-lg font-semibold pr-2">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-3 sm:justify-end pt-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1 min-w-[100px]"
          >
            {finalCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'w-full sm:w-auto order-1 sm:order-2 min-w-[100px]',
              variant === 'destructive' && 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600/20 dark:bg-red-600 dark:hover:bg-red-700',
              variant === 'warning' && 'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-600/20 dark:bg-amber-600 dark:hover:bg-amber-700',
              variant === 'default' && 'bg-primary text-primary-foreground',
              loading && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('common.processing')}
              </span>
            ) : (
              finalConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

