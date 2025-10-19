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

const features = [
  {
    icon: BookOpen,
    title: 'Development Logs',
    description: 'Document your development journey with rich text notes and code snippets.',
  },
  {
    icon: Kanban,
    title: 'Kanban Boards',
    description: 'Organize tasks with intuitive drag-and-drop boards and custom workflows.',
  },
  {
    icon: LineChart,
    title: 'Analytics & Insights',
    description: 'Track your productivity and progress with detailed analytics and reports.',
  },
  {
    icon: Timer,
    title: 'Timeline View',
    description: 'Visualize your project timeline and milestones in a beautiful interface.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team seamlessly with shared projects and real-time updates.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built with modern tech stack for exceptional performance and reliability.',
  },
]

export function Features() {
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
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help developers track, manage, and showcase their work.
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
