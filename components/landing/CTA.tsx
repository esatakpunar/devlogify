'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function CTA() {
  const t = useTranslation()
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-12 text-center"
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

          <div className="relative space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              {t('landing.readyToStartTracking')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.joinThousandsOfDevelopers')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="text-lg px-8 h-12">
                <Link href="/signup">
                  {t('landing.getStartedFree')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('landing.noCreditCardRequired')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
