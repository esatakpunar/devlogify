'use client'

import React, { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ErrorBoundaryContentProps {
  hasError: boolean
  error: Error | null
  fallback?: ReactNode
  onReset: () => void
  onReload: () => void
}

export function ErrorBoundaryContent({ 
  hasError, 
  error, 
  fallback, 
  onReset, 
  onReload 
}: ErrorBoundaryContentProps) {
  const t = useTranslation()

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('common.somethingWentWrong')}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              {error?.message || t('common.anUnexpectedErrorOccurred')}
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="w-full mb-4 text-left">
                <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer mb-2">
                  {t('common.errorDetails')}
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={onReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('common.tryAgain')}
              </Button>
              <Button
                onClick={onReload}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('common.reloadPage')}
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="ghost"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                {t('common.goHome')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return null
}

