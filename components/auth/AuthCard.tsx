'use client'

import type { ReactNode, FormEventHandler } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  submitLabel: string
  loadingLabel?: string
  loading?: boolean
  submitDisabled?: boolean
  submitType?: 'submit' | 'button'
  submitVariant?: 'default' | 'outline'
  onSubmit?: FormEventHandler<HTMLFormElement>
  onSubmitClick?: () => void
  error?: string | null
  success?: string | null
  footer?: ReactNode
  contentClassName?: string
  cardClassName?: string
  iconContainerClassName?: string
}

export function AuthCard({
  icon,
  title,
  description,
  children,
  submitLabel,
  loadingLabel,
  loading = false,
  submitDisabled = false,
  submitType = 'submit',
  submitVariant = 'default',
  onSubmit,
  onSubmitClick,
  error,
  success,
  footer,
  contentClassName,
  cardClassName,
  iconContainerClassName,
}: AuthCardProps) {
  const body = (
    <>
      <CardContent className={cn('flex-1 space-y-4 pb-6', contentClassName)}>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}
        {children}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button
          type={submitType}
          variant={submitVariant}
          className="w-full"
          disabled={submitDisabled}
          onClick={onSubmitClick}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? (loadingLabel || submitLabel) : submitLabel}
        </Button>
        {footer}
      </CardFooter>
    </>
  )

  return (
    <Card className={cn('flex flex-col border shadow-sm lg:min-h-[460px]', cardClassName)}>
      <CardHeader className="space-y-1">
        <div className={cn('mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10', iconContainerClassName)}>
          {icon}
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      {onSubmit ? (
        <form onSubmit={onSubmit} className="flex h-full flex-1 flex-col">
          {body}
        </form>
      ) : (
        body
      )}
    </Card>
  )
}
