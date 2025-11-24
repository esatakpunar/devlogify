/**
 * AI Task Grouping
 * Groups similar tasks and suggests tags
 */

import type { Task } from '@/lib/supabase/queries/tasks'

export interface TaskGroup {
  id: string
  name: string
  tasks: Task[]
  suggestedTags: string[]
  reason: string
}

export interface TagSuggestion {
  tag: string
  tasks: string[] // Task IDs
  confidence: number
}

/**
 * Generate task groups using AI
 */
export async function generateTaskGroups(tasks: Task[]): Promise<TaskGroup[]> {
  if (tasks.length === 0) {
    return []
  }

  const taskSummary = tasks
    .map((task, index) => {
      return `${index + 1}. ${task.title}${task.description ? ` - ${task.description}` : ''} (ID: ${task.id}, Priority: ${task.priority}, Status: ${task.status})`
    })
    .join('\n')

  const prompt = `You are a task management assistant. Analyze the following tasks and group similar ones together.

Tasks:
${taskSummary}

Return a JSON object with the following structure:
{
  "groups": [
    {
      "name": "Group name (descriptive, e.g., 'API Development', 'UI Components')",
      "task_ids": [1, 3, 5],
      "suggested_tags": ["api", "backend"],
      "reason": "Brief explanation of why these tasks are grouped together"
    }
  ],
  "tag_suggestions": [
    {
      "tag": "tag-name",
      "task_ids": [1, 2, 3],
      "confidence": 0.8
    }
  ]
}

IMPORTANT: 
- task_ids must be the NUMERIC INDEX (1, 2, 3...) from the task list above, NOT the task ID
- The first task in the list is index 1, second is index 2, etc.
- Only use task indices that exist in the list (1 to ${tasks.length})

Guidelines:
- Group tasks that are related by topic, technology, or workflow
- Each task can belong to multiple groups
- Suggest meaningful tags that would help with filtering
- Confidence should be between 0 and 1
- Aim for 3-8 groups maximum
- Focus on actionable groupings

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

        const parsed = JSON.parse(text) as {
          groups: any[]
          tag_suggestions: any[]
        }

        // Map task indices to actual tasks
        const groups: TaskGroup[] = parsed.groups.map((group, index) => {
          const groupTasks = group.task_ids
            .map((idx: number) => {
              // Convert 1-based index to 0-based
              const taskIndex = idx - 1
              if (taskIndex < 0 || taskIndex >= tasks.length) {
                console.warn(`Invalid task index ${idx} (1-based), skipping. Total tasks: ${tasks.length}`)
                return null
              }
              return tasks[taskIndex]
            })
            .filter((task): task is Task => task !== null && task !== undefined)

          if (groupTasks.length === 0) {
            console.warn(`Group "${group.name}" has no valid tasks after mapping`)
          }

          return {
            id: `group-${index}`,
            name: group.name,
            tasks: groupTasks,
            suggestedTags: group.suggested_tags || [],
            reason: group.reason || '',
          }
        }).filter(group => group.tasks.length > 0) // Remove groups with no valid tasks

        return groups
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
    console.error('Error generating task groups:', error)
    throw error
  }
}

/**
 * Generate tag suggestions for tasks
 */
export async function generateTagSuggestions(tasks: Task[]): Promise<TagSuggestion[]> {
  if (tasks.length === 0) {
    return []
  }

  // Use the same grouping logic but focus on tags
  const groups = await generateTaskGroups(tasks)
  
  // Extract tag suggestions from groups
  const tagMap = new Map<string, Set<string>>()

  groups.forEach((group) => {
    group.suggestedTags.forEach((tag) => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, new Set())
      }
      group.tasks.forEach((task) => {
        tagMap.get(tag)!.add(task.id)
      })
    })
  })

  const suggestions: TagSuggestion[] = Array.from(tagMap.entries()).map(([tag, taskIds]) => ({
    tag,
    tasks: Array.from(taskIds),
    confidence: 0.7, // Default confidence
  }))

  return suggestions
}

