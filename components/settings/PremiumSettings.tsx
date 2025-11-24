'use client'

import { useState } from 'react'
import { Sparkles, Brain, Calendar, Zap, Layers, Check, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePremium } from '@/lib/hooks/usePremium'
import { UpgradeDialog } from '@/components/premium/UpgradeDialog'

interface PremiumSettingsProps {
  userId: string
}

const aiFeatures = [
  {
    icon: Brain,
    title: 'AI Task Suggestions',
    description: 'Get intelligent task recommendations based on your work patterns and project history',
  },
  {
    icon: Calendar,
    title: 'Daily Standup Summary',
    description: 'Automated daily standup summaries with insights, priorities, and time estimates',
  },
  {
    icon: Sparkles,
    title: 'AI Task Generation',
    description: 'Generate tasks from notes and descriptions using advanced AI',
  },
  {
    icon: Layers,
    title: 'Smart Task Grouping',
    description: 'Automatically group and organize tasks with AI assistance',
  },
  {
    icon: Zap,
    title: 'AI Tag Suggestions',
    description: 'Get smart tag recommendations for better task organization',
  },
]

export function PremiumSettings({ userId }: PremiumSettingsProps) {
  const { isPremium, loading } = usePremium(userId)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">Premium Active</h3>
                <Badge className="bg-purple-600 text-white">Active</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You have access to all premium AI features
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-purple-100 dark:border-purple-800/50"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <Check className="w-4 h-4 text-green-600" />
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
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold">Premium Features</h3>
                <Badge className="bg-gray-600 text-white">Upgrade Required</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock powerful AI features to boost your productivity
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-purple-100 dark:border-purple-800/50 opacity-75"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-4 border border-purple-200 dark:border-purple-800 mb-4">
            <h4 className="font-semibold text-sm mb-2">What you get with Premium:</h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                All AI-powered features unlocked
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Unlimited AI task suggestions
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Daily standup summaries
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Smart task grouping and organization
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Priority support
              </li>
            </ul>
          </div>

          <Button
            onClick={() => setUpgradeDialogOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Premium
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

