import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingNav } from '@/components/landing/LandingNav'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { AIFeatures } from '@/components/landing/AIFeatures'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'

interface HomeProps {
  searchParams: Promise<{ code?: string; type?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const code = params?.code
  const type = params?.type

  // If there's a code parameter, redirect to callback
  // This handles password reset links from email
  // Even if user is logged in, recovery code should be handled
  if (code) {
    const callbackUrl = type 
      ? `/auth/callback?code=${code}&type=${type}`
      : `/auth/callback?code=${code}`
    redirect(callbackUrl)
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <AIFeatures />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
