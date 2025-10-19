'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for solo developers',
    features: [
      'Up to 3 projects',
      'Basic analytics',
      'Community support',
      '1 GB storage',
      'Timeline view',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$12',
    description: 'For professional developers',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      '10 GB storage',
      'Custom integrations',
      'Team collaboration (up to 5)',
      'Export functionality',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: '$29',
    description: 'For growing teams',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated support',
      '100 GB storage',
      'Advanced security',
      'Custom branding',
      'API access',
      'SSO authentication',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export function Pricing() {
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
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
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
                    Most Popular
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
                  <span className="text-muted-foreground">/month</span>
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
          All plans include basic features. No credit card required for free trial.
        </motion.p>
      </div>
    </section>
  )
}
