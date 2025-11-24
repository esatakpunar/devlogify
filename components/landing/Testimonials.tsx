'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function Testimonials() {
  const t = useTranslation()
  
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: t('landing.testimonials.fullStackDeveloper'),
      company: t('landing.testimonials.techStartup'),
      image: '👩‍💻',
      content: t('landing.testimonials.sarahChen'),
      rating: 5,
    },
    {
      name: 'Marcus Rodriguez',
      role: t('landing.testimonials.engineeringManager'),
      company: t('landing.testimonials.fortune500'),
      image: '👨‍💼',
      content: t('landing.testimonials.marcusRodriguez'),
      rating: 5,
    },
    {
      name: 'Emily Watson',
      role: t('landing.testimonials.indieDeveloper'),
      company: t('landing.testimonials.selfEmployed'),
      image: '👩‍🎨',
      content: t('landing.testimonials.emilyWatson'),
      rating: 5,
    },
    {
      name: 'James Park',
      role: t('landing.testimonials.techLead'),
      company: t('landing.testimonials.saasCompany'),
      image: '👨‍💻',
      content: t('landing.testimonials.jamesPark'),
      rating: 5,
    },
    {
      name: 'Aisha Patel',
      role: t('landing.testimonials.productDesigner'),
      company: t('landing.testimonials.designAgency'),
      image: '👩‍🎨',
      content: t('landing.testimonials.aishaPatel'),
      rating: 5,
    },
    {
      name: 'David Kim',
      role: t('landing.testimonials.seniorDeveloper'),
      company: t('landing.testimonials.consultingFirm'),
      image: '👨‍🔬',
      content: t('landing.testimonials.davidKim'),
      rating: 5,
    },
  ]
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            {t('landing.testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.testimonials.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-card p-6 space-y-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="text-3xl">{testimonial.image}</div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
