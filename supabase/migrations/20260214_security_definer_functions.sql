-- SECURITY DEFINER functions for cross-user operations
-- These run with the permissions of the function creator (postgres), bypassing RLS
-- No service_role key needed - just call via supabase.rpc()

-- 1. Accept invitation: handles the full flow of accepting a company invitation
CREATE OR REPLACE FUNCTION accept_company_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_invitation RECORD;
  v_existing_company_id UUID;
  v_existing_member_id UUID;
  v_default_team_id UUID;
  v_company RECORD;
  v_member_name TEXT;
  v_profile RECORD;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized', 'status', 401);
  END IF;

  -- Find pending invitation by token
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token AND status = 'pending';

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invitation', 'status', 400);
  END IF;

  -- Check if expired
  IF v_invitation.expires_at < now() THEN
    UPDATE invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('error', 'Invitation has expired', 'status', 400);
  END IF;

  -- Check if user already in a company
  SELECT company_id INTO v_existing_company_id
  FROM profiles WHERE id = v_user_id;

  IF v_existing_company_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'You are already a member of a company', 'status', 400);
  END IF;

  -- Check if already a member of target company
  SELECT id INTO v_existing_member_id
  FROM company_members
  WHERE company_id = v_invitation.company_id AND user_id = v_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'You are already a member of this company', 'status', 400);
  END IF;

  -- Add user to company
  INSERT INTO company_members (company_id, user_id, role)
  VALUES (v_invitation.company_id, v_user_id, v_invitation.role);

  -- Add to default "General" team
  SELECT id INTO v_default_team_id
  FROM teams
  WHERE company_id = v_invitation.company_id AND name = 'General'
  LIMIT 1;

  IF v_default_team_id IS NOT NULL THEN
    INSERT INTO team_members (team_id, user_id)
    VALUES (v_default_team_id, v_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Update profile with company_id
  UPDATE profiles SET company_id = v_invitation.company_id WHERE id = v_user_id;

  -- Mark invitation as accepted
  UPDATE invitations SET status = 'accepted' WHERE id = v_invitation.id;

  -- Create notification for company owner
  SELECT owner_id, name INTO v_company
  FROM companies WHERE id = v_invitation.company_id;

  IF v_company IS NOT NULL THEN
    SELECT full_name, email INTO v_profile
    FROM profiles WHERE id = v_user_id;

    v_member_name := COALESCE(v_profile.full_name, v_profile.email, 'A new member');

    INSERT INTO notifications (user_id, company_id, type, title, message, metadata)
    VALUES (
      v_company.owner_id,
      v_invitation.company_id,
      'member_joined',
      'New member joined',
      v_member_name || ' has joined ' || v_company.name,
      jsonb_build_object('member_id', v_user_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'company_id', v_invitation.company_id);
END;
$$;

-- 2. Get member email preferences (for sending email notifications)
CREATE OR REPLACE FUNCTION get_member_email_prefs(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_same_company BOOLEAN;
  v_profile RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Verify caller and target user are in the same company
  SELECT EXISTS (
    SELECT 1 FROM company_members cm1
    JOIN company_members cm2 ON cm1.company_id = cm2.company_id
    WHERE cm1.user_id = v_caller_id AND cm2.user_id = p_user_id
  ) INTO v_same_company;

  IF NOT v_same_company THEN
    RETURN jsonb_build_object('error', 'Not in same company');
  END IF;

  SELECT email, notifications_enabled INTO v_profile
  FROM profiles WHERE id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  RETURN jsonb_build_object(
    'email', v_profile.email,
    'notifications_enabled', COALESCE(v_profile.notifications_enabled, true)
  );
END;
$$;

-- 3. Create notification for company member (with company membership verification)
CREATE OR REPLACE FUNCTION create_company_notification(
  p_user_id UUID,
  p_company_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_member BOOLEAN;
  v_notification RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Verify caller is in the same company
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id AND user_id = v_caller_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('error', 'Not a member of this company');
  END IF;

  INSERT INTO notifications (user_id, company_id, type, title, message, metadata)
  VALUES (p_user_id, p_company_id, p_type, p_title, p_message, p_metadata)
  RETURNING * INTO v_notification;

  RETURN jsonb_build_object(
    'success', true,
    'notification', jsonb_build_object(
      'id', v_notification.id,
      'user_id', v_notification.user_id,
      'company_id', v_notification.company_id,
      'type', v_notification.type,
      'title', v_notification.title,
      'message', v_notification.message,
      'created_at', v_notification.created_at
    )
  );
END;
$$;
