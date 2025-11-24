import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTasksFromNotes } from '@/lib/ai/gemini'
import { checkIsPremium } from '@/lib/utils/premium'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check premium status
    const isPremium = await checkIsPremium(user.id, supabase)
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required to use AI features' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { notes } = body

    if (!notes || typeof notes !== 'string' || !notes.trim()) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      )
    }

    // Limit notes length to prevent abuse (50,000 characters max)
    if (notes.length > 50000) {
      return NextResponse.json(
        { error: 'Notes are too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      )
    }

    // Generate tasks using AI
    const tasks = await generateTasksFromNotes(notes)

    return NextResponse.json({ tasks })
  } catch (error: any) {
    console.error('Error generating tasks:', error)
    
    // Return user-friendly error messages
    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error.message?.includes('overloaded') || error.message?.includes('UNAVAILABLE')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate tasks' },
      { status: 500 }
    )
  }
}

