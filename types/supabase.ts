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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          join_code: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          join_code: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          join_code?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      company_members: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          color: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          color?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          color?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: 'admin' | 'member'
          invited_by: string
          token: string
          status: 'pending' | 'accepted' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          role?: 'admin' | 'member'
          invited_by: string
          token: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          role?: 'admin' | 'member'
          invited_by?: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          expires_at?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          company_id: string
          type: string
          title: string
          message: string | null
          metadata: Record<string, any> | null
          is_read: boolean
          email_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          type: string
          title: string
          message?: string | null
          metadata?: Record<string, any> | null
          is_read?: boolean
          email_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          type?: string
          title?: string
          message?: string | null
          metadata?: Record<string, any> | null
          is_read?: boolean
          email_sent?: boolean
          created_at?: string
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
          company_id: string | null
          team_id: string | null
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
          company_id?: string | null
          team_id?: string | null
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
          company_id?: string | null
          team_id?: string | null
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
          company_id: string | null
          assignee_id: string | null
          responsible_id: string | null
          review_status: 'pending' | 'approved' | 'rejected' | 'changes_requested' | null
          review_note: string | null
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
          company_id?: string | null
          assignee_id?: string | null
          responsible_id?: string | null
          review_status?: 'pending' | 'approved' | 'rejected' | 'changes_requested' | null
          review_note?: string | null
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
          company_id?: string | null
          assignee_id?: string | null
          responsible_id?: string | null
          review_status?: 'pending' | 'approved' | 'rejected' | 'changes_requested' | null
          review_note?: string | null
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          task_id?: string | null
          action_type: string
          metadata?: Record<string, any>
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          task_id?: string | null
          action_type?: string
          metadata?: Record<string, any>
          company_id?: string | null
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          task_id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration: number | null
          note: string | null
          is_manual: boolean
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          started_at: string
          ended_at?: string | null
          duration?: number | null
          note?: string | null
          is_manual?: boolean
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration?: number | null
          note?: string | null
          is_manual?: boolean
          company_id?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Convenience type aliases
export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type CompanyMember = Database['public']['Tables']['company_members']['Row']
export type CompanyMemberInsert = Database['public']['Tables']['company_members']['Insert']
export type CompanyMemberUpdate = Database['public']['Tables']['company_members']['Update']

export type Team = Database['public']['Tables']['teams']['Row']
export type TeamInsert = Database['public']['Tables']['teams']['Insert']
export type TeamUpdate = Database['public']['Tables']['teams']['Update']

export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert']
export type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update']

export type Invitation = Database['public']['Tables']['invitations']['Row']
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert']
export type InvitationUpdate = Database['public']['Tables']['invitations']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']

// Extended types with relations
export type CompanyMemberWithProfile = CompanyMember & {
  profile: Profile
}

export type TeamMemberWithProfile = TeamMember & {
  profile: Profile
}

export type InvitationWithInviter = Invitation & {
  invited_by_profile: Profile
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_review_requested'
  | 'task_approved'
  | 'task_rejected'
  | 'task_changes_requested'
  | 'invitation'
  | 'team_added'
  | 'member_joined'
