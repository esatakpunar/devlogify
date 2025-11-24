'use client'

import { useState } from 'react'
import { Sparkles, Brain, Calendar, Zap, Layers, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'

interface AIFeaturesPromoProps {
  userId: string
}

const features = [
  {
    icon: Brain,
    title: 'AI Task Suggestions',
    description: 'Get intelligent recommendations',
  },
  {
    icon: Calendar,
    title: 'Daily Standup',
    description: 'Automated summaries',
  },
  {
    icon: Sparkles,
    title: 'AI Task Generation',
    description: 'Create tasks from notes',
  },
  {
    icon: Layers,
    title: 'Smart Grouping',
    description: 'Organize tasks with AI',
  },
]

export function AIFeaturesPromo({ userId }: AIFeaturesPromoProps) {
  const { isPremium, loading } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  // Don't show if user is premium or still loading
  if (loading || isPremium) {
    return null
  }

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">AI-Powered Features</h3>
                <Badge className="bg-purple-600 text-white">Premium</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock powerful AI features to boost your productivity
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-purple-100 dark:border-purple-800/50"
            >
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs mb-0.5">{feature.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => setUpgradeDialogOpen(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Premium
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </>
  )
}

