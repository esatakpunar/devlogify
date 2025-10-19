'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Code2 } from 'lucide-react'

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Code2 className="h-6 w-6" />
          <span className="font-bold text-xl">Devlogify</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
