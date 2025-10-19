'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Full Stack Developer',
    company: 'Tech Startup',
    image: '👩‍💻',
    content:
      'Devlogify has completely transformed how I track my projects. The timeline view is incredible for showcasing my work to clients.',
    rating: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Engineering Manager',
    company: 'Fortune 500',
    image: '👨‍💼',
    content:
      'Our team productivity increased by 40% after switching to Devlogify. The kanban boards and analytics are game-changers.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Indie Developer',
    company: 'Self-Employed',
    image: '👩‍🎨',
    content:
      'As a solo developer, Devlogify helps me stay organized and motivated. The development logs are perfect for documenting my journey.',
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'Tech Lead',
    company: 'SaaS Company',
    image: '👨‍💻',
    content:
      'The best project tracking tool I\'ve used. Clean interface, powerful features, and the team collaboration features are outstanding.',
    rating: 5,
  },
  {
    name: 'Aisha Patel',
    role: 'Product Designer',
    company: 'Design Agency',
    image: '👩‍🎨',
    content:
      'Love how intuitive Devlogify is! I can track my design projects alongside development work seamlessly.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Senior Developer',
    company: 'Consulting Firm',
    image: '👨‍🔬',
    content:
      'Devlogify made it easy to manage multiple client projects. The analytics help me understand where I spend my time.',
    rating: 5,
  },
]

export function Testimonials() {
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
            Loved by Developers Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say about their experience with Devlogify.
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
