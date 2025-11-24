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

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

const aiFeatures = [
  {
    icon: Brain,
    title: 'AI Task Suggestions',
    description: 'Get intelligent task recommendations based on your work patterns',
  },
  {
    icon: Calendar,
    title: 'Daily Standup Summary',
    description: 'Automated daily standup summaries with insights and priorities',
  },
  {
    icon: Sparkles,
    title: 'AI Task Generation',
    description: 'Generate tasks from notes and descriptions using AI',
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

export function UpgradeDialog({ open, onOpenChange, feature }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Unlock AI Features</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Upgrade to Premium to access powerful AI-powered features
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {feature && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                🔒 This feature requires Premium: <span className="font-semibold">{feature}</span>
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4">Premium AI Features</h3>
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
                <h4 className="font-semibold text-sm mb-1">What you get with Premium:</h4>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• All AI-powered features unlocked</li>
                  <li>• Unlimited AI task suggestions</li>
                  <li>• Daily standup summaries</li>
                  <li>• Smart task grouping and organization</li>
                  <li>• Priority support</li>
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
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                window.location.href = 'mailto:esatakpunar@gmail.com?subject=Premium Upgrade Request&body=Hello, I would like to upgrade to Premium to access AI features.'
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

