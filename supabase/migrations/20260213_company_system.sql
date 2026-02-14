-- ============================================
-- Phase 1: Company System Migration
-- Transforms single-user system to Company > Teams > Users hierarchy
-- ============================================

-- 1. Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  join_code TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create company_members table
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- 3. Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 5. Create invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Alter profiles table - add company_id
ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id);

-- 8. Alter projects table - add company_id and team_id
ALTER TABLE projects ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id);

-- 9. Alter tasks table - add company_id, assignee_id, responsible_id, review fields
ALTER TABLE tasks ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN responsible_id UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'changes_requested'));
ALTER TABLE tasks ADD COLUMN review_note TEXT;

-- 10. Alter notes table - add company_id
ALTER TABLE notes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 11. Alter activity_logs table - add company_id
ALTER TABLE activity_logs ADD COLUMN company_id UUID REFERENCES companies(id);

-- 12. Alter time_entries table - add company_id
ALTER TABLE time_entries ADD COLUMN company_id UUID REFERENCES companies(id);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_join_code ON companies(join_code);
CREATE INDEX idx_companies_owner_id ON companies(owner_id);

CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);

CREATE INDEX idx_teams_company_id ON teams(company_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

CREATE INDEX idx_invitations_company_id ON invitations(company_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_tasks_company_id ON tasks(company_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_responsible_id ON tasks(responsible_id);
CREATE INDEX idx_notes_company_id ON notes(company_id);
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_time_entries_company_id ON time_entries(company_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Companies: members can view, owner/admin can modify
CREATE POLICY "Members can view their company"
  ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can update company"
  ON companies FOR UPDATE
  USING (id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Company Members: members can view, admins can manage
CREATE POLICY "Members can view company members"
  ON company_members FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "Admins can insert company members"
  ON company_members FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can update company members"
  ON company_members FOR UPDATE
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete company members"
  ON company_members FOR DELETE
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Teams: company members can view, admins can manage
CREATE POLICY "Company members can view teams"
  ON teams FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert teams"
  ON teams FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update teams"
  ON teams FOR UPDATE
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete teams"
  ON teams FOR DELETE
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Team Members: company members can view, admins can manage
CREATE POLICY "Company members can view team members"
  ON team_members FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())));

CREATE POLICY "Admins can insert team members"
  ON team_members FOR INSERT
  WITH CHECK (team_id IN (SELECT id FROM teams WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin')));

CREATE POLICY "Admins can delete team members"
  ON team_members FOR DELETE
  USING (team_id IN (SELECT id FROM teams WHERE company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin')));

-- Invitations: admins can manage
CREATE POLICY "Admins can view invitations"
  ON invitations FOR SELECT
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Notifications: users can view/manage their own
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Update existing table policies to be company-aware
-- Projects
CREATE POLICY "Company members can view projects"
  ON projects FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can update projects"
  ON projects FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can delete projects"
  ON projects FOR DELETE
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

-- Tasks
CREATE POLICY "Company members can view tasks"
  ON tasks FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can update tasks"
  ON tasks FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can delete tasks"
  ON tasks FOR DELETE
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

-- Notes
CREATE POLICY "Company members can view notes"
  ON notes FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can insert notes"
  ON notes FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can update notes"
  ON notes FOR UPDATE
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "Company members can delete notes"
  ON notes FOR DELETE
  USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
    OR (company_id IS NULL AND user_id = auth.uid())
  );
