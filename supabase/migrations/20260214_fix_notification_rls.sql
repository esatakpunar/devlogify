-- Fix notification RLS policies
-- Drop existing policies if they exist and recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
  DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, nothing to do
  NULL;
END $$;

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Any authenticated user in the same company can create notifications for other users
-- This is needed because users create notifications for assignees/responsible users
CREATE POLICY "Company members can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
