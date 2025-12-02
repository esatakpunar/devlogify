'use client'

import { useState } from 'react'
import { Sparkles, Brain, Calendar, Zap, Layers, ArrowRight, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface AIFeaturesPromoProps {
  userId: string
}

export function AIFeaturesPromo({ userId }: AIFeaturesPromoProps) {
  const { isPremium, loading } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const t = useTranslation()

  // Don't show if user is premium or still loading
  if (loading || isPremium) {
    return null
  }

  const features = [
    {
      icon: Brain,
      title: t('dashboard.aiFeatures.aiTaskSuggestions'),
      description: t('dashboard.aiFeatures.aiTaskSuggestionsDescription'),
    },
    {
      icon: Calendar,
      title: t('dashboard.aiFeatures.dailyStandup'),
      description: t('dashboard.aiFeatures.dailyStandupDescription'),
    },
    {
      icon: Sparkles,
      title: t('dashboard.aiFeatures.aiTaskGeneration'),
      description: t('dashboard.aiFeatures.aiTaskGenerationDescription'),
    },
    {
      icon: Layers,
      title: t('dashboard.aiFeatures.smartGrouping'),
      description: t('dashboard.aiFeatures.smartGroupingDescription'),
    },
    {
      icon: Share2,
      title: t('premium.shareAndExport'),
      description: t('premium.shareAndExportDescription'),
    },
  ]

  return (
    <>
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <h3 className="text-base sm:text-lg font-semibold dark:text-white">{t('dashboard.aiFeatures.title')}</h3>
                <Badge className="bg-purple-600 text-white text-xs">{t('premium.premium')}</Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.aiFeatures.description')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-purple-100 dark:border-purple-800/50"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs mb-0.5 dark:text-gray-200">{feature.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => setUpgradeDialogOpen(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
          {t('premium.upgradeToPremium')}
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:ml-2" />
        </Button>
      </Card>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </>
  )
}

