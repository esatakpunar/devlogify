'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Check, Zap, Brain, Calendar, Layers, Share2, Download } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function UpgradeDialog({ open, onOpenChange, feature }: UpgradeDialogProps) {
  const t = useTranslation()
  
  const aiFeatures = [
    {
      icon: Brain,
      title: t('premium.aiTaskSuggestions'),
      description: t('premium.aiTaskSuggestionsDescription'),
    },
    {
      icon: Calendar,
      title: t('premium.dailyStandupSummary'),
      description: t('premium.dailyStandupSummaryDescription'),
    },
    {
      icon: Sparkles,
      title: t('premium.aiTaskGeneration'),
      description: t('premium.aiTaskGenerationDescription'),
    },
    {
      icon: Layers,
      title: t('premium.smartTaskGrouping'),
      description: t('premium.smartTaskGroupingDescription'),
    },
    {
      icon: Zap,
      title: t('premium.aiTagSuggestions'),
      description: t('premium.aiTagSuggestionsDescription'),
    },
    {
      icon: Share2,
      title: t('premium.shareAndExport'),
      description: t('premium.shareAndExportDescription'),
    },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
            <DialogTitle className="text-lg sm:text-2xl">
              {feature === 'Unlimited Projects' ? t('premium.upgradeToPremium') : t('premium.unlockAIFeatures')}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base mt-1">
              {feature === 'Unlimited Projects' 
                ? t('premium.upgradeToPremiumForUnlimitedProjects')
                : t('premium.unlockPowerfulAIFeatures')}
            </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
          {feature && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-200">
                {feature === 'Unlimited Projects' ? (
                  <>
                    🔒 {t('premium.freePlanLimitedTo3Projects')} <span className="font-semibold">{t('premium.upgradeForUnlimitedProjects')}</span>.
                  </>
                ) : (
                  <>
                    🔒 {t('premium.thisFeatureRequiresPremium')}: <span className="font-semibold">{feature}</span>
                  </>
                )}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">{t('premium.premiumAIFeatures')}</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 dark:text-gray-200">{feature.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2 mb-2 sm:mb-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm mb-1 dark:text-gray-200">{t('premium.whatYouGetWithPremium')}</h4>
                <ul className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <li>• {t('premium.unlimitedProjects')}</li>
                  <li>• {t('premium.allAIPoweredFeaturesUnlocked')}</li>
                  <li>• {t('premium.unlimitedAITaskSuggestions')}</li>
                  <li>• {t('premium.dailyStandupSummaries')}</li>
                  <li>• {t('premium.smartTaskGroupingAndOrganization')}</li>
                  <li>• {t('premium.shareAndExport')}</li>
                  <li>• {t('premium.prioritySupport')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs sm:text-sm"
            >
              {t('premium.maybeLater')}
            </Button>
            <Button
              onClick={() => {
                window.location.href = `mailto:esatakpunar@gmail.com?subject=${encodeURIComponent(t('premium.upgradeRequestSubject'))}&body=${encodeURIComponent(t('premium.upgradeRequestBody'))}`
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              {t('premium.upgradeToPremium')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

