/**
 * Google Gemini Pro API Client
 * Converts meeting notes or free-form text into structured tasks
 */

export interface AITask {
  title: string
  description: string // Required - must include context and details
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number // in minutes
}

export interface AITasksResponse {
  tasks: AITask[]
}

// API key should only be used server-side
// For client-side, use the API route: /api/ai/generate-tasks
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY && typeof window === 'undefined') {
  console.warn('GEMINI_API_KEY is not set. AI features will not work.')
}

/**
 * Helper function to generate content with retry logic
 */
async function generateWithRetry(
  genAI: any,
  modelName: string,
  prompt: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<string> {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a retryable error (overloaded, unavailable, rate limited, etc.)
      const isRetryable = 
        error.message?.includes('overloaded') ||
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('Resource exhausted') ||
        error.message?.includes('429') ||
        error.message?.includes('503') ||
        error.status === 'UNAVAILABLE' ||
        error.code === 503 ||
        error.code === 429 ||
        error.status === 429 ||
        error.status === 503

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      // Wait before retrying (exponential backoff with longer delay for rate limits)
      // For 429 errors, use longer delays
      const baseDelay = error.code === 429 || error.status === 429 ? 3000 : retryDelay
      const delay = baseDelay * Math.pow(2, attempt - 1)
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
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
 * Converts notes/text into structured tasks using Google Gemini Pro
 */
export async function generateTasksFromNotes(notes: string, locale: string = 'en'): Promise<AITask[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.')
  }

  const languageName = getLanguageName(locale)
  const languageInstruction = locale !== 'en' 
    ? `\n\nIMPORTANT: All responses (task titles, descriptions, and any text) must be in ${languageName}. Do not use English unless the user's input is in English.`
    : ''

  const prompt = `You are a task management assistant. Analyze the following meeting notes or text and extract meaningful, actionable tasks. Group related small actions into larger, cohesive tasks.${languageInstruction}

Notes:
${notes}

Return a JSON object with the following structure:
{
  "tasks": [
    {
      "title": "Task title (required, concise and actionable - should represent a complete work item)",
      "description": "Detailed description (REQUIRED - must include context, steps, or important details)",
      "priority": "low|medium|high (based on urgency and importance)",
      "estimated_duration": number in minutes (optional, estimate how long the task might take)
    }
  ]
}

CRITICAL GUIDELINES:
1. TASK GROUPING:
   - DO NOT create separate tasks for each small step or sub-action
   - Group related actions into single, meaningful tasks
   - Example: Instead of "Send email", "Schedule meeting", "Prepare agenda" → Create ONE task: "Schedule and prepare team meeting" with description including all steps
   - A task should represent a complete work item that can be tracked independently

2. DESCRIPTION REQUIREMENTS:
   - Description is REQUIRED for EVERY task - never leave it empty
   - Include relevant context, steps, requirements, or important details
   - If the task involves multiple steps, list them in the description
   - Provide enough information so someone can understand what needs to be done
   - Example: "Review and update the API documentation for the new authentication endpoints. Include code examples, error handling scenarios, and rate limiting information."

3. TASK QUALITY:
   - Each task should be substantial enough to be meaningful (not micro-tasks)
   - Avoid creating tasks for trivial actions that take less than 5 minutes
   - Combine related small tasks into one larger task
   - Focus on outcomes and deliverables, not just activities

4. PRIORITY ASSIGNMENT:
   - "high": Urgent, critical, blocking other work, or time-sensitive
   - "medium": Normal priority, important but not urgent
   - "low": Nice-to-have, can be deferred, or less critical

5. DURATION ESTIMATION:
   - Estimate realistically in minutes
   - Consider the full scope of the task including all related work
   - If unsure, provide a reasonable range estimate

6. OUTPUT:
   - If no meaningful tasks can be extracted, return an empty tasks array
   - Aim for 3-8 substantial tasks rather than 10+ micro-tasks
   - Quality over quantity

Return ONLY valid JSON, no additional text or markdown formatting.`

  try {
    // Using Google Generative AI SDK
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    
    // Try models in order of preference (fastest/cheapest first)
    const models = ['gemini-2.0-flash', 'gemini-2.5-pro','gemini-2.5-flash']
    let lastError: any = null

    for (const modelName of models) {
      try {
        // Use more retries for rate limit scenarios (429 errors)
        const text = await generateWithRetry(genAI, modelName, prompt, 4, 2000)

        // Parse JSON from response
        // Sometimes Gemini wraps JSON in markdown code blocks
        let jsonText = text.trim()
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }

        const parsed = JSON.parse(jsonText) as AITasksResponse

        // Validate response structure
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('Invalid response format from AI: tasks array not found')
        }

        // Validate each task
        const validatedTasks: AITask[] = parsed.tasks
          .filter((task: any) => {
            // Must have title, description, and priority
            if (!task.title || typeof task.title !== 'string' || !task.title.trim()) return false
            if (!task.description || typeof task.description !== 'string' || !task.description.trim()) return false
            if (!task.priority || !['low', 'medium', 'high'].includes(task.priority)) return false
            return true
          })
          .map((task: any) => ({
            title: task.title.trim(),
            description: task.description.trim(), // Description is now required
            priority: task.priority as 'low' | 'medium' | 'high',
            estimated_duration: task.estimated_duration && typeof task.estimated_duration === 'number' 
              ? Math.max(0, task.estimated_duration) 
              : undefined,
          }))

        return validatedTasks
      } catch (error: any) {
        lastError = error
        // If it's not a model availability error, don't try other models
        const isModelError = 
          error.message?.includes('not found') ||
          error.message?.includes('overloaded') ||
          error.message?.includes('UNAVAILABLE') ||
          error.message?.includes('Resource exhausted') ||
          error.message?.includes('429') ||
          error.status === 'UNAVAILABLE' ||
          error.code === 503 ||
          error.code === 429 ||
          error.code === 404 ||
          error.status === 429 ||
          error.status === 503

        if (!isModelError) {
          // This is a parsing or other error, don't try other models
          throw error
        }
        
        // Continue to next model
        console.warn(`Model ${modelName} failed, trying next model...`, error.message)
      }
    }

    // All models failed
    throw lastError || new Error('All Gemini models are currently unavailable. Please try again later.')
  } catch (error: any) {
    console.error('Error generating tasks from AI:', error)
    
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid API key. Please check your GEMINI_API_KEY configuration.')
    }
    
    if (error.message?.includes('overloaded') || error.message?.includes('UNAVAILABLE')) {
      throw new Error('The AI service is currently overloaded. Please try again in a few moments.')
    }
    
    if (error.message?.includes('Resource exhausted') || error.message?.includes('429') || error.code === 429 || error.status === 429) {
      throw new Error('API rate limit exceeded. Please wait a moment and try again. If this persists, you may need to upgrade your API quota.')
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. Please try again.')
    }
    
    throw new Error(error.message || 'Failed to generate tasks from AI')
  }
}

