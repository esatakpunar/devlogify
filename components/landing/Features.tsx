'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Kanban,
  LineChart,
  Timer,
  Users,
  Zap
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function Features() {
  const t = useTranslation()
  
  const features = [
    {
      icon: BookOpen,
      title: t('landing.features.developmentLogs'),
      description: t('landing.features.developmentLogsDescription'),
    },
    {
      icon: Kanban,
      title: t('landing.features.kanbanBoards'),
      description: t('landing.features.kanbanBoardsDescription'),
    },
    {
      icon: LineChart,
      title: t('landing.features.analyticsInsights'),
      description: t('landing.features.analyticsInsightsDescription'),
    },
    {
      icon: Timer,
      title: t('landing.features.timelineView'),
      description: t('landing.features.timelineViewDescription'),
    },
    {
      icon: Users,
      title: t('landing.features.teamCollaboration'),
      description: t('landing.features.teamCollaborationDescription'),
    },
    {
      icon: Zap,
      title: t('landing.features.lightningFast'),
      description: t('landing.features.lightningFastDescription'),
    },
  ]
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            {t('landing.everythingYouNeedToSucceed')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.featuresDescription')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              <div className="relative space-y-4">
                <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
