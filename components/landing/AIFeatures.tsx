'use client'

import { motion } from 'framer-motion'
import { Brain, Calendar, Sparkles, Layers, Zap, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const aiFeatures = [
  {
    icon: Brain,
    title: 'AI Task Suggestions',
    description: 'Get intelligent task recommendations based on your work patterns and project history.',
  },
  {
    icon: Calendar,
    title: 'Daily Standup Summary',
    description: 'Automated daily standup summaries with insights, priorities, and time estimates.',
  },
  {
    icon: Sparkles,
    title: 'AI Task Generation',
    description: 'Generate tasks from notes and descriptions using advanced AI technology.',
  },
  {
    icon: Layers,
    title: 'Smart Task Grouping',
    description: 'Automatically group and organize tasks with AI assistance for better workflow.',
  },
  {
    icon: Zap,
    title: 'AI Tag Suggestions',
    description: 'Get smart tag recommendations for better task organization and filtering.',
  },
]

export function AIFeatures() {
  const handleUpgrade = () => {
    window.location.href = 'mailto:esatakpunar@gmail.com?subject=Premium Upgrade Request&body=Hello, I would like to upgrade to Premium to access AI features.'
  }

  return (
    <section id="ai-features" className="py-20 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/50 dark:bg-gray-900/50 mb-4">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <Badge className="bg-purple-600 text-white">Premium</Badge>
            <span className="text-sm font-medium">AI-Powered Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Supercharge Your Productivity
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              with AI
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful AI features that help you work smarter, not harder. Let AI handle the heavy lifting so you can focus on building.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {aiFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-6 rounded-xl border bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-purple-200 dark:border-purple-800"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <div className="relative space-y-4">
                <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                  <feature.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-purple-200 dark:border-purple-800 shadow-lg">
            <div className="text-left sm:text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Unlock AI Features?</h3>
              <p className="text-muted-foreground">
                Upgrade to Premium and start using AI-powered features today.
              </p>
            </div>
            <Button
              onClick={handleUpgrade}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

