'use client'

import { motion } from 'framer-motion'
import { UserPlus, FolderPlus, Sparkles, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your free account in seconds. No credit card required.',
    step: '01',
  },
  {
    icon: FolderPlus,
    title: 'Create Your First Project',
    description: 'Set up your project and start organizing your development work.',
    step: '02',
  },
  {
    icon: Sparkles,
    title: 'Track Your Progress',
    description: 'Use kanban boards, notes, and timeline to document your journey.',
    step: '03',
  },
  {
    icon: TrendingUp,
    title: 'Analyze & Grow',
    description: 'Review analytics to understand your productivity and improve.',
    step: '04',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with Devlogify in four simple steps and transform how you track your development work.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connecting line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -z-10" />
              )}

              <div className="space-y-4 text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                  <div className="inline-flex p-4 rounded-2xl bg-background border shadow-sm">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
