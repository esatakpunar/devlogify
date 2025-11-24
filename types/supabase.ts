export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          theme: 'light' | 'dark' | 'system'
          notifications_enabled: boolean
          week_starts_on: 'monday' | 'sunday'
          language: 'tr' | 'en' | 'de' | 'es'
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          theme?: 'light' | 'dark' | 'system'
          notifications_enabled?: boolean
          week_starts_on?: 'monday' | 'sunday'
          language?: 'tr' | 'en' | 'de' | 'es'
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          theme?: 'light' | 'dark' | 'system'
          notifications_enabled?: boolean
          week_starts_on?: 'monday' | 'sunday'
          language?: 'tr' | 'en' | 'de' | 'es'
          is_premium?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          color: string
          status: 'active' | 'archived' | 'completed'
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          color?: string
          status?: 'active' | 'archived' | 'completed'
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          color?: string
          status?: 'active' | 'archived' | 'completed'
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'done'
          priority: 'low' | 'medium' | 'high'
          estimated_duration: number | null
          actual_duration: number
          progress: number
          order_index: number
          tags: string[] | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high'
          estimated_duration?: number | null
          actual_duration?: number
          progress?: number
          order_index?: number
          tags?: string[] | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high'
          estimated_duration?: number | null
          actual_duration?: number
          progress?: number
          order_index?: number
          tags?: string[] | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          project_id: string | null
          user_id: string
          title: string | null
          content: string
          tags: string[] | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id: string
          title?: string | null
          content: string
          tags?: string[] | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string
          title?: string | null
          content?: string
          tags?: string[] | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      task_templates: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          estimated_duration: number | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          estimated_duration?: number | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          estimated_duration?: number | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      recurring_tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          template_id: string | null
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          estimated_duration: number | null
          schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom'
          schedule_config: Record<string, any>
          cron_expression: string | null
          is_active: boolean
          last_created_at: string | null
          next_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          template_id?: string | null
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          estimated_duration?: number | null
          schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom'
          schedule_config?: Record<string, any>
          cron_expression?: string | null
          is_active?: boolean
          last_created_at?: string | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          template_id?: string | null
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          estimated_duration?: number | null
          schedule_type?: 'daily' | 'weekly' | 'monthly' | 'custom'
          schedule_config?: Record<string, any>
          cron_expression?: string | null
          is_active?: boolean
          last_created_at?: string | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          task_id: string | null
          action_type: string
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          task_id?: string | null
          action_type: string
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          task_id?: string | null
          action_type?: string
          metadata?: Record<string, any>
          created_at?: string
        }
      }
    }
  }
}