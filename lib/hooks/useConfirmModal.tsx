'use client'

import { useState, useCallback, useRef } from 'react'
import { ConfirmModal, ConfirmVariant } from '@/components/ui/confirm-modal'

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolvePromiseRef = useRef<((value: boolean) => void) | null>(null)
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setIsOpen(true)
      resolvePromiseRef.current = resolve
      setOnConfirmCallback(null)
    })
  }, [])

  const confirmWithAction = useCallback((
    opts: ConfirmOptions,
    onConfirm: () => void | Promise<void>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setIsOpen(true)
      resolvePromiseRef.current = resolve
      setOnConfirmCallback(() => onConfirm)
    })
  }, [])

  const handleConfirm = useCallback(async () => {
    if (onConfirmCallback) {
      setLoading(true)
      try {
        await onConfirmCallback()
        if (resolvePromiseRef.current) {
          resolvePromiseRef.current(true)
          resolvePromiseRef.current = null
        }
        setIsOpen(false)
      } catch (error) {
        console.error('Confirm action failed:', error)
        // Don't close on error, let user retry
      } finally {
        setLoading(false)
      }
    } else {
      if (resolvePromiseRef.current) {
        resolvePromiseRef.current(true)
        resolvePromiseRef.current = null
      }
      setIsOpen(false)
    }
  }, [onConfirmCallback])

  const handleCancel = useCallback(() => {
    if (resolvePromiseRef.current) {
      resolvePromiseRef.current(false)
      resolvePromiseRef.current = null
    }
    setIsOpen(false)
    setOptions(null)
    setOnConfirmCallback(null)
  }, [])

  const Modal = options ? (
    <ConfirmModal
      open={isOpen}
      onOpenChange={handleCancel}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
      onConfirm={handleConfirm}
      loading={loading}
    />
  ) : null

  return {
    confirm,
    confirmWithAction,
    Modal,
  }
}

