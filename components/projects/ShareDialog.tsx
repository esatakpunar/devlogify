'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Copy, ExternalLink, X } from 'lucide-react'
import { toast } from 'sonner'
import { getShareUrl, copyToClipboard } from '@/lib/utils/sharing'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceType: 'project'
  resourceId: string
  userId: string
}

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  userId,
}: ShareDialogProps) {
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiryDays, setExpiryDays] = useState(7)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const { isPremium } = usePremium(userId)
  const t = useTranslation()

  useEffect(() => {
    // Reset share token when dialog closes
    if (!open) {
      setShareToken(null)
    }
  }, [open])

  const createShareLink = async () => {
    if (!isPremium) {
      setUpgradeDialogOpen(true)
      return
    }

    setLoading(true)
    try {
      // Calculate expiry date if needed
      const expiresAt = hasExpiry
        ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
        : undefined

      const response = await fetch('/api/sharing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          expiresAt: expiresAt?.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create share link')
      }

      const { token } = await response.json()
      setShareToken(token)
    } catch (error) {
      console.error('Failed to create share link:', error)
      toast.error(t('sharing.failedToCreateLink'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shareToken) return

    const url = getShareUrl(shareToken)
    const success = await copyToClipboard(url)
    
    if (success) {
      toast.success(t('sharing.linkCopied'))
    } else {
      toast.error(t('sharing.failedToCopyLink'))
    }
  }

  const handleDeactivate = async () => {
    if (!shareToken) return

    setLoading(true)
    try {
      const response = await fetch('/api/sharing/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: shareToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate share link')
      }

      setShareToken(null)
      toast.success(t('sharing.shareLinkDeactivated'))
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to deactivate share link:', error)
      toast.error(t('sharing.failedToDeactivateLink'))
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = shareToken ? getShareUrl(shareToken) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('sharing.shareProject')}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t('sharing.createPublicLink')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {loading && !shareToken ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : shareToken ? (
            <>
              {/* Share URL */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">{t('sharing.shareLink')}</Label>
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-xs sm:text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shareUrl, '_blank')}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Expiry Settings */}
              <div className="space-y-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs sm:text-sm">{t('sharing.setExpiryDate')}</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('sharing.linkWillExpire')}</p>
                  </div>
                  <Switch
                    checked={hasExpiry}
                    onCheckedChange={setHasExpiry}
                  />
                </div>
                {hasExpiry && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-20 sm:w-24 text-sm sm:text-base"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('sharing.days')}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-3 sm:pt-4">
                <Button
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="flex-1 text-xs sm:text-sm"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  {t('sharing.deactivateLink')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  {t('common.close')}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Expiry Settings - Show before creating link */}
              <div className="space-y-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs sm:text-sm">{t('sharing.setExpiryDate')}</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('sharing.linkWillExpire')}</p>
                  </div>
                  <Switch
                    checked={hasExpiry}
                    onCheckedChange={setHasExpiry}
                  />
                </div>
                {hasExpiry && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-20 sm:w-24 text-sm sm:text-base"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('sharing.days')}</span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={createShareLink}
                disabled={loading}
                className="w-full text-xs sm:text-sm"
              >
                {loading ? t('sharing.creating') : t('sharing.createShareLink')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        feature="Share & Export"
      />
    </Dialog>
  )
}

