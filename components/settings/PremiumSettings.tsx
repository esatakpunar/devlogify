'use client'

import { useState } from 'react'
import { Sparkles, Brain, Calendar, Zap, Layers, Check, Crown, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface PremiumSettingsProps {
  userId: string
}

export function PremiumSettings({ userId }: PremiumSettingsProps) {
  const { isPremium, loading } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{t('premium.premiumActive')}</h3>
                <Badge className="bg-purple-600 text-white">{t('premium.active')}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('premium.accessToAllPremiumFeatures')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-purple-100 dark:border-purple-800/50"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{t('premium.premiumFeatures')}</h3>
                <Badge className="bg-gray-600 text-white">{t('premium.upgradeRequired')}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('premium.unlockPowerfulAIFeatures')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 mb-5">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-purple-100 dark:border-purple-800/50 opacity-75"
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

          <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800 mb-4">
            <h4 className="font-semibold text-sm mb-2">{t('premium.whatYouGetWithPremium')}</h4>
            <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{t('premium.allAIPoweredFeaturesUnlocked')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{t('premium.unlimitedAITaskSuggestions')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{t('premium.dailyStandupSummaries')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{t('premium.smartTaskGroupingAndOrganization')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{t('premium.shareAndExport')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>{t('premium.prioritySupport')}</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={() => setUpgradeDialogOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('premium.upgradeToPremium')}
          </Button>
        </div>
      </div>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </>
  )
}

