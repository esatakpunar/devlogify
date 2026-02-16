'use client'

import { useState } from 'react'
import { useCompanyStore } from '@/lib/store/companyStore'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { updateCompany, regenerateJoinCode } from '@/lib/supabase/queries/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Tooltip } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Copy, RefreshCw, Save, Loader2 } from 'lucide-react'

interface CompanySettingsProps {
  companyId: string
  isAdmin: boolean
}

export function CompanySettings({ companyId, isAdmin }: CompanySettingsProps) {
  const t = useTranslation()
  const { company, fetchCompany } = useCompanyStore()

  const [name, setName] = useState(company?.name || '')
  const [logoUrl, setLogoUrl] = useState(company?.logo_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('company.nameRequired'))
      return
    }

    setIsSaving(true)
    try {
      await updateCompany(companyId, {
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
      })
      await fetchCompany(companyId)
      toast.success(t('company.settingsSaved'))
    } catch (error) {
      console.error('Error updating company:', error)
      toast.error(t('company.settingsSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateJoinCode = async () => {
    setIsRegenerating(true)
    try {
      await regenerateJoinCode(companyId)
      // Force re-fetch to bypass cache
      useCompanyStore.setState({ company: null })
      await fetchCompany(companyId)
      toast.success(t('company.joinCodeRegenerated'))
    } catch (error) {
      console.error('Error regenerating join code:', error)
      toast.error(t('company.joinCodeRegenerateError'))
    } finally {
      setIsRegenerating(false)
      setShowRegenerateConfirm(false)
    }
  }

  const handleCopyJoinCode = async () => {
    if (!company?.join_code) return
    try {
      await navigator.clipboard.writeText(company.join_code)
      toast.success(t('company.joinCodeCopied'))
    } catch {
      toast.error(t('company.joinCodeCopyError'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="company-name">{t('company.nameLabel')}</Label>
        <Input
          id="company-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('company.namePlaceholder')}
          disabled={!isAdmin}
        />
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="company-logo">{t('company.logoUrlLabel')}</Label>
        <Input
          id="company-logo"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder={t('company.logoUrlPlaceholder')}
          disabled={!isAdmin}
        />
        {logoUrl && (
          <div className="mt-2">
            <img
              src={logoUrl}
              alt={t('company.logoPreview')}
              className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      {isAdmin && (
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t('company.saveSettings')}
        </Button>
      )}

      <Separator />

      {/* Join Code */}
      <div className="space-y-3">
        <Label>{t('company.joinCodeLabel')}</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('company.joinCodeDescription')}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-lg tracking-widest select-all">
            {company?.join_code || '--------'}
          </div>
          <Tooltip content={t('company.copyJoinCode')}>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyJoinCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </Tooltip>
          {isAdmin && (
            <Tooltip content={t('company.regenerateJoinCode')}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowRegenerateConfirm(true)}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Slug (read-only) */}
      <div className="space-y-2">
        <Label>{t('company.slugLabel')}</Label>
        <Input
          value={company?.slug || ''}
          disabled
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('company.slugDescription')}
        </p>
      </div>

      {/* Regenerate Join Code Confirm */}
      <ConfirmModal
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
        title={t('company.regenerateJoinCodeTitle')}
        description={t('company.regenerateJoinCodeDescription')}
        confirmText={t('company.regenerateJoinCode')}
        variant="warning"
        onConfirm={handleRegenerateJoinCode}
        loading={isRegenerating}
      />
    </div>
  )
}
