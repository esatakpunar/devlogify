/**
 * AI Daily Standup Summary
 * Generates a summary of yesterday's work and today's plan
 */

import type { Database } from '@/types/supabase'
import type { Task } from '@/lib/supabase/queries/tasks'

type Activity = Database['public']['Tables']['activity_logs']['Row'] & {
  project?: { id: string; title: string; color: string } | null
  task?: { id: string; title: string } | null
}

export interface StandupSummary {
  yesterday: {
    completed: string[]
    timeSpent: string
    highlights: string[]
  }
  today: {
    planned: string[]
    priorities: string[]
    estimatedTime: string
  }
  insights: string[]
}

/**
 * Generate daily standup summary
 */
export async function generateStandupSummary(
  yesterdayActivities: Activity[],
  todayTasks: Task[]
): Promise<StandupSummary> {
  // Format yesterday's activities
  const yesterdaySummary = yesterdayActivities
    .map((activity) => {
      const metadata = activity.metadata as any || {}
      const duration = metadata.duration || 0
      const time = duration
        ? `${Math.floor(duration / 60)}h ${duration % 60}m`
        : 'N/A'
      const description = activity.metadata?.task_title || activity.action_type || 'Activity'
      return `- ${description} (${time})`
    })
    .join('\n')

  const totalYesterdayMinutes = yesterdayActivities.reduce(
    (sum, a) => {
      const metadata = a.metadata as any || {}
      return sum + (metadata.duration || 0)
    },
    0
  )
  const yesterdayTime = `${Math.floor(totalYesterdayMinutes / 60)}h ${totalYesterdayMinutes % 60}m`

  // Format today's tasks
  const todayTasksSummary = todayTasks
    .map((task, index) => {
      return `${index + 1}. ${task.title} (Priority: ${task.priority}, Status: ${task.status})`
    })
    .join('\n')

  const prompt = `You are a productivity assistant. Generate a daily standup summary based on the following information:

YESTERDAY'S ACTIVITIES:
${yesterdaySummary || 'No activities recorded'}

Total time spent yesterday: ${yesterdayTime}

TODAY'S PLANNED TASKS:
${todayTasksSummary || 'No tasks planned'}

Generate a concise, actionable standup summary in JSON format:
{
  "yesterday": {
    "completed": ["List of 3-5 key accomplishments from yesterday"],
    "timeSpent": "Total time spent (e.g., '4h 30m')",
    "highlights": ["2-3 most important achievements or milestones"]
  },
  "today": {
    "planned": ["List of 3-5 main tasks planned for today"],
    "priorities": ["Top 2-3 priority items for today"],
    "estimatedTime": "Estimated time needed (e.g., '5h 30m')"
  },
  "insights": ["2-3 insights, patterns, or recommendations based on the data"]
}

Guidelines:
- Keep summaries concise and actionable
- Focus on outcomes, not just activities
- Identify patterns or blockers if any
- Provide realistic time estimates
- Be encouraging and constructive

Return ONLY valid JSON, no additional text or markdown formatting.`

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const models = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash']
    let lastError: any = null

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const response = await result.response
        let text = response.text().trim()

        // Parse JSON
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }

        const parsed = JSON.parse(text) as StandupSummary

        // Validate and set defaults
        return {
          yesterday: {
            completed: parsed.yesterday?.completed || [],
            timeSpent: parsed.yesterday?.timeSpent || yesterdayTime,
            highlights: parsed.yesterday?.highlights || [],
          },
          today: {
            planned: parsed.today?.planned || [],
            priorities: parsed.today?.priorities || [],
            estimatedTime: parsed.today?.estimatedTime || 'N/A',
          },
          insights: parsed.insights || [],
        }
      } catch (error: any) {
        lastError = error
        const isModelError =
          error.message?.includes('not found') ||
          error.message?.includes('overloaded') ||
          error.message?.includes('UNAVAILABLE') ||
          error.message?.includes('Resource exhausted') ||
          error.message?.includes('429')

        if (!isModelError) {
          throw error
        }
      }
    }

    // Fallback if all models fail
    return {
      yesterday: {
        completed: yesterdayActivities.slice(0, 5).map((a) => {
          const metadata = a.metadata as any || {}
          return metadata.task_title || a.action_type || 'Activity'
        }),
        timeSpent: yesterdayTime,
        highlights: [],
      },
      today: {
        planned: todayTasks.slice(0, 5).map((t) => t.title),
        priorities: todayTasks.filter((t) => t.priority === 'high').slice(0, 3).map((t) => t.title),
        estimatedTime: 'N/A',
      },
      insights: [],
    }
  } catch (error) {
    console.error('Error generating standup summary:', error)
    throw error
  }
}

