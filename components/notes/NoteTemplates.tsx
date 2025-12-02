'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Code, Bug, Calendar, Lightbulb } from 'lucide-react'

interface NoteTemplate {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  content: string
}

const templates: NoteTemplate[] = [
  {
    id: 'daily-log',
    name: 'Daily Log',
    icon: Calendar,
    content: `# Daily Log - ${new Date().toLocaleDateString()}

## What I did today
- 

## What I learned
- 

## Challenges
- 

## Tomorrow's plan
- 
`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: FileText,
    content: `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Attendees:** 

## Agenda
- 

## Discussion
- 

## Action Items
- [ ] 
`,
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    icon: Bug,
    content: `# Bug Report

**Date:** ${new Date().toLocaleDateString()}

## Description
Brief description of the bug

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: 
- Browser: 
- Version: 

## Additional Notes
`,
  },
  {
    id: 'code-snippet',
    name: 'Code Snippet',
    icon: Code,
    content: `# Code Snippet

**Language:** 
**Description:** 

\`\`\`javascript
// Your code here
\`\`\`

## Notes
`,
  },
  {
    id: 'idea',
    name: 'Idea',
    icon: Lightbulb,
    content: `# Idea

**Date:** ${new Date().toLocaleDateString()}

## Concept
Brief description of the idea

## Why
Why this idea is valuable

## How
How to implement

## Next Steps
- [ ] 
`,
  },
]

interface NoteTemplatesProps {
  onSelectTemplate: (content: string) => void
}

export function NoteTemplates({ onSelectTemplate }: NoteTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const handleSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      onSelectTemplate(template.content)
      setSelectedTemplate('')
    }
  }

  return (
    <div className="space-y-2">
      <Select value={selectedTemplate} onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{template.name}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

