'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function Pricing() {
  const t = useTranslation()
  
  const plans = [
    {
      name: t('landing.pricing.free'),
      price: '$0',
      description: t('landing.pricing.freeDescription'),
      features: [
        t('landing.pricing.upTo3Projects'),
        t('landing.pricing.basicAnalytics'),
        t('landing.pricing.communitySupport'),
        t('landing.pricing.1GBStorage'),
        t('landing.pricing.timelineView'),
      ],
      aiFeatures: [],
      cta: t('landing.pricing.getStarted'),
      popular: false,
    },
    {
      name: t('landing.pricing.pro'),
      price: '$12',
      description: t('landing.pricing.proDescription'),
      features: [
        t('landing.pricing.unlimitedProjects'),
        t('landing.pricing.advancedAnalytics'),
        t('landing.pricing.prioritySupport'),
        t('landing.pricing.10GBStorage'),
        t('landing.pricing.customIntegrations'),
        t('landing.pricing.teamCollaboration'),
        t('landing.pricing.exportFunctionality'),
      ],
      aiFeatures: [
        t('premium.aiTaskSuggestions'),
        t('premium.dailyStandupSummary'),
        t('premium.aiTaskGeneration'),
        t('premium.smartTaskGrouping'),
        t('premium.aiTagSuggestions'),
        t('premium.shareAndExport'),
      ],
      cta: t('landing.pricing.startFreeTrial'),
      popular: true,
    },
    {
      name: t('landing.pricing.team'),
      price: '$29',
      description: t('landing.pricing.teamDescription'),
      features: [
        t('landing.pricing.everythingInPro'),
        t('landing.pricing.unlimitedTeamMembers'),
        t('landing.pricing.dedicatedSupport'),
        t('landing.pricing.100GBStorage'),
        t('landing.pricing.advancedSecurity'),
        t('landing.pricing.customBranding'),
        t('landing.pricing.apiAccess'),
        t('landing.pricing.ssoAuthentication'),
      ],
      aiFeatures: [
        t('landing.pricing.allAIFeaturesFromPro'),
        t('landing.pricing.teamWideAIInsights'),
        t('landing.pricing.advancedAIAnalytics'),
      ],
      cta: t('landing.pricing.contactSales'),
      popular: false,
    },
  ]
  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.pricing.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl border bg-card p-8 ${
                plan.popular
                  ? 'shadow-xl scale-105 border-primary'
                  : 'hover:shadow-lg transition-shadow'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                    {t('landing.pricing.mostPopular')}
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{t('landing.pricing.perMonth')}</span>
                </div>

                <Button
                  asChild
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link href="/login">{plan.cta}</Link>
                </Button>

                <div className="space-y-3 pt-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.aiFeatures && plan.aiFeatures.length > 0 && (
                    <>
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-600">{t('landing.pricing.aiFeatures')}</span>
                        </div>
                        {plan.aiFeatures.map((feature) => (
                          <div key={feature} className="flex items-start gap-3 mb-2">
                            <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          {t('landing.pricing.footerNote')}
        </motion.p>
      </div>
    </section>
  )
}
