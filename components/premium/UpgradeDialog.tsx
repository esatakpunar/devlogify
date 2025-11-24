'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Check, Zap, Brain, Calendar, Layers } from 'lucide-react'
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
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
            <DialogTitle className="text-2xl">
              {feature === 'Unlimited Projects' ? t('premium.upgradeToPremium') : t('premium.unlockAIFeatures')}
            </DialogTitle>
            <DialogDescription className="text-base mt-1">
              {feature === 'Unlimited Projects' 
                ? t('premium.upgradeToPremiumForUnlimitedProjects')
                : t('premium.unlockPowerfulAIFeatures')}
            </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {feature && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
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
            <h3 className="text-lg font-semibold mb-4">{t('premium.premiumAIFeatures')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2 mb-3">
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">{t('premium.whatYouGetWithPremium')}</h4>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• {t('premium.unlimitedProjects')}</li>
                  <li>• {t('premium.allAIPoweredFeaturesUnlocked')}</li>
                  <li>• {t('premium.unlimitedAITaskSuggestions')}</li>
                  <li>• {t('premium.dailyStandupSummaries')}</li>
                  <li>• {t('premium.smartTaskGroupingAndOrganization')}</li>
                  <li>• {t('premium.prioritySupport')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('premium.maybeLater')}
            </Button>
            <Button
              onClick={() => {
                window.location.href = `mailto:esatakpunar@gmail.com?subject=${encodeURIComponent(t('premium.upgradeRequestSubject'))}&body=${encodeURIComponent(t('premium.upgradeRequestBody'))}`
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('premium.upgradeToPremium')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

