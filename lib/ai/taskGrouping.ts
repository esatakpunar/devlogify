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
 * Get language name from locale code
 */
function getLanguageName(locale: string): string {
  const languageMap: Record<string, string> = {
    'tr': 'Turkish',
    'en': 'English',
    'de': 'German',
    'es': 'Spanish',
  }
  return languageMap[locale] || 'English'
}

/**
 * Generate task groups using AI
 */
export async function generateTaskGroups(tasks: Task[], locale: string = 'en'): Promise<TaskGroup[]> {
  if (tasks.length === 0) {
    return []
  }

  // Collect all existing tags to avoid duplicates
  const allExistingTags = new Set<string>()
  tasks.forEach(task => {
    if (task.tags && Array.isArray(task.tags)) {
      task.tags.forEach(tag => allExistingTags.add(tag.toLowerCase().trim()))
    }
  })

  const taskSummary = tasks
    .map((task, index) => {
      const existingTags = task.tags && Array.isArray(task.tags) && task.tags.length > 0
        ? ` [Existing Tags: ${task.tags.join(', ')}]`
        : ''
      return `${index + 1}. ${task.title}${task.description ? ` - ${task.description}` : ''}${existingTags} (ID: ${task.id}, Priority: ${task.priority}, Status: ${task.status})`
    })
    .join('\n')

  const existingTagsList = Array.from(allExistingTags).length > 0
    ? `\n\nIMPORTANT - Existing Tags (DO NOT suggest these again):\n${Array.from(allExistingTags).join(', ')}\n`
    : ''

  const languageName = getLanguageName(locale)
  const languageInstruction = locale !== 'en' 
    ? `\n\nIMPORTANT: All responses (group names, reasons, suggested tags, and any text) must be in ${languageName}. Do not use English unless the user's existing tasks are in English.`
    : ''

  const prompt = `You are a task management assistant. Analyze the following tasks and group similar ones together.${languageInstruction}

Tasks:
${taskSummary}${existingTagsList}

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
- DO NOT suggest tags that already exist on tasks (see existing tags list above)
- When suggesting tags for a group, only suggest NEW tags that are not already present on the tasks in that group
- Compare tag names case-insensitively (e.g., "API" and "api" are the same)

Guidelines:
- Group tasks that are related by topic, technology, or workflow
- Each task can belong to multiple groups
- Suggest meaningful tags that would help with filtering
- Only suggest tags that are NOT already present on the tasks
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
            .filter((task: Task | null): task is Task => task !== null && task !== undefined)

          if (groupTasks.length === 0) {
            console.warn(`Group "${group.name}" has no valid tasks after mapping`)
          }

          // Collect all existing tags from tasks in this group
          const groupExistingTags = new Set<string>()
          groupTasks.forEach((task: Task) => {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                groupExistingTags.add(tag.toLowerCase().trim())
              })
            }
          })

          // Filter out tags that already exist on any task in the group
          const suggestedTags = (group.suggested_tags || []).filter((tag: string) => {
            const normalizedTag = tag.toLowerCase().trim()
            return !groupExistingTags.has(normalizedTag)
          })

          return {
            id: `group-${index}`,
            name: group.name,
            tasks: groupTasks,
            suggestedTags,
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
export async function generateTagSuggestions(tasks: Task[], locale: string = 'en'): Promise<TagSuggestion[]> {
  if (tasks.length === 0) {
    return []
  }

  // Use the same grouping logic but focus on tags
  const groups = await generateTaskGroups(tasks, locale)
  
  // Extract tag suggestions from groups, filtering out existing tags
  const tagMap = new Map<string, Set<string>>()

  groups.forEach((group) => {
    group.suggestedTags.forEach((tag) => {
      // Check if this tag already exists on any task in the group
      const normalizedTag = tag.toLowerCase().trim()
      const hasExistingTag = group.tasks.some(task => {
        if (task.tags && Array.isArray(task.tags)) {
          return task.tags.some(existingTag => existingTag.toLowerCase().trim() === normalizedTag)
        }
        return false
      })

      // Only add if tag doesn't already exist
      if (!hasExistingTag) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, new Set())
        }
        group.tasks.forEach((task) => {
          tagMap.get(tag)!.add(task.id)
        })
      }
    })
  })

  const suggestions: TagSuggestion[] = Array.from(tagMap.entries()).map(([tag, taskIds]) => ({
    tag,
    tasks: Array.from(taskIds),
    confidence: 0.7, // Default confidence
  }))

  return suggestions
}

