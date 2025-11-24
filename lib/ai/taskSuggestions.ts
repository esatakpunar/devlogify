/**
 * AI Task Suggestions
 * Analyzes existing tasks to suggest new related tasks
 */

import { generateTasksFromNotes } from './gemini'
import type { Task } from '@/lib/supabase/queries/tasks'

export interface TaskSuggestion {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number
  reason: string // Why this task is suggested
  related_task_ids?: string[] // Related existing task IDs
}

/**
 * Generate task suggestions based on existing tasks
 */
export async function generateTaskSuggestions(tasks: Task[]): Promise<TaskSuggestion[]> {
  if (tasks.length === 0) {
    return []
  }

  // Analyze tasks and create a summary
  const taskSummary = tasks
    .map((task, index) => {
      return `${index + 1}. ${task.title}${task.description ? ` - ${task.description}` : ''} (Priority: ${task.priority}, Status: ${task.status})`
    })
    .join('\n')

  const prompt = `You are a task management assistant. Analyze the following existing tasks and suggest new tasks that:
1. Are related to or follow logically from existing tasks
2. Fill gaps in the workflow
3. Are dependencies or prerequisites that might be missing
4. Are follow-up tasks that would naturally come next

Existing Tasks:
${taskSummary}

Return a JSON object with the following structure:
{
  "suggestions": [
    {
      "title": "Task title (required, concise and actionable)",
      "description": "Detailed description explaining what needs to be done and why",
      "priority": "low|medium|high (based on urgency and relation to existing tasks)",
      "estimated_duration": number in minutes (optional, estimate how long the task might take),
      "reason": "Brief explanation of why this task is suggested (e.g., 'Follow-up to task X', 'Missing dependency for task Y', 'Natural next step')",
      "related_task_ids": [] (optional, if you can identify which existing tasks this relates to, use their index numbers from the list above)
    }
  ]
}

Guidelines:
- Suggest 3-8 meaningful tasks maximum
- Focus on actionable, specific tasks
- Prioritize tasks that are clearly related to existing work
- Avoid suggesting tasks that are too similar to existing ones
- Include context in the description about why this task is needed
- Use "high" priority for critical missing dependencies
- Use "medium" for normal follow-up tasks
- Use "low" for nice-to-have improvements

Return ONLY valid JSON, no additional text or markdown formatting.`

  try {
    // Use the existing generateTasksFromNotes but with a custom prompt
    // We'll need to modify the approach to get structured suggestions
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

        const parsed = JSON.parse(text) as { suggestions: any[] }

        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
          throw new Error('Invalid response format')
        }

        const suggestions: TaskSuggestion[] = parsed.suggestions
          .filter((s: any) => s.title && s.description)
          .map((s: any) => ({
            title: s.title.trim(),
            description: s.description.trim(),
            priority: (s.priority || 'medium') as 'low' | 'medium' | 'high',
            estimated_duration: s.estimated_duration || undefined,
            reason: s.reason || 'Suggested based on task analysis',
            related_task_ids: s.related_task_ids || [],
          }))

        return suggestions
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

    throw lastError || new Error('All models failed')
  } catch (error) {
    console.error('Error generating task suggestions:', error)
    throw error
  }
}

