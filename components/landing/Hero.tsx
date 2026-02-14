'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function Hero() {
  const t = useTranslation()
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:pb-20 sm:pt-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('landing.trackYourDevelopmentJourney')}</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t('landing.buildBetterProducts')}
            <br />
            <span className="text-primary">{t('landing.trackEveryStep')}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-xl md:text-2xl"
          >
            {t('landing.heroDescription')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" asChild className="text-lg px-8 h-12">
              <Link href="/signup">
                {t('landing.getStartedFree')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 h-12">
              <Link href="#features">
                {t('landing.learnMore')}
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mx-auto grid max-w-3xl grid-cols-1 gap-3 pt-10 sm:grid-cols-3 sm:gap-4 sm:pt-12"
          >
            <div className="rounded-xl border bg-card/60 px-4 py-3 sm:bg-transparent sm:border-0 sm:p-0">
              <div className="text-2xl font-bold sm:text-3xl">10K+</div>
              <div className="text-sm text-muted-foreground">{t('landing.activeUsers')}</div>
            </div>
            <div className="rounded-xl border bg-card/60 px-4 py-3 sm:bg-transparent sm:border-0 sm:p-0">
              <div className="text-2xl font-bold sm:text-3xl">50K+</div>
              <div className="text-sm text-muted-foreground">{t('landing.projectsTracked')}</div>
            </div>
            <div className="rounded-xl border bg-card/60 px-4 py-3 sm:bg-transparent sm:border-0 sm:p-0">
              <div className="text-2xl font-bold sm:text-3xl">99.9%</div>
              <div className="text-sm text-muted-foreground">{t('landing.uptime')}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
