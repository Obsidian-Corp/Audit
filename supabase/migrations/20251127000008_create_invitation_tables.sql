-- ============================================================================
-- INVITATION SYSTEM FOR MULTI-TENANT ONBOARDING
-- ============================================================================
-- Creates tables and functions for employee and client invitations
-- Ensures proper multi-tenancy and security

-- ============================================================================
-- 1. USER (EMPLOYEE) INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role app_role NOT NULL,
  department TEXT,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure only firm employee roles (not client roles)
  CONSTRAINT valid_employee_role CHECK (
    role IN ('partner', 'practice_leader', 'business_development',
             'engagement_manager', 'senior_auditor', 'staff_auditor')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_firm ON user_invitations(firm_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Firm admins can view and manage invitations for their firm
CREATE POLICY "firm_admins_manage_invitations" ON user_invitations
FOR ALL TO authenticated
USING (
  firm_id IN (
    SELECT ur.firm_id
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'firm_administrator'
  )
);

-- ============================================================================
-- 2. CLIENT INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id UUID,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  role app_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure only client roles
  CONSTRAINT valid_client_role CHECK (
    role IN ('client_administrator', 'client_user')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_firm ON client_invitations(firm_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_client ON client_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_expires ON client_invitations(expires_at);

-- Enable RLS
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Firm admins and engagement managers can view and manage client invitations
CREATE POLICY "firm_users_manage_client_invitations" ON client_invitations
FOR ALL TO authenticated
USING (
  firm_id IN (
    SELECT p.firm_id
    FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND (
    -- Firm administrators can manage all
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'firm_administrator'
      AND ur.firm_id = client_invitations.firm_id
    )
    OR
    -- Engagement managers can manage their engagement invitations
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('engagement_manager', 'partner')
      AND ur.firm_id = client_invitations.firm_id
    )
  )
);

-- ============================================================================
-- 3. HELPER FUNCTION: Generate secure invitation token
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a secure random token (URL-safe)
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- ============================================================================
-- 4. FUNCTION: Create employee invitation
-- ============================================================================
CREATE OR REPLACE FUNCTION create_employee_invitation(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role app_role,
  p_department TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_invitation_id UUID;
  v_token TEXT;
  v_result JSONB;
BEGIN
  -- Get the firm_id of the inviting user
  SELECT firm_id INTO v_firm_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_firm_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not associated with a firm'
    );
  END IF;

  -- Check if user is a firm administrator
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND firm_id = v_firm_id
    AND role = 'firm_administrator'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only firm administrators can invite employees'
    );
  END IF;

  -- Check if email is already in use in this firm
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE email = p_email
    AND firm_id = v_firm_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists in your firm'
    );
  END IF;

  -- Check if there's a pending invitation for this email
  IF EXISTS (
    SELECT 1 FROM user_invitations
    WHERE email = p_email
    AND firm_id = v_firm_id
    AND accepted_at IS NULL
    AND expires_at > NOW()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An invitation is already pending for this email'
    );
  END IF;

  -- Generate secure token
  v_token := generate_invitation_token();

  -- Create invitation
  INSERT INTO user_invitations (
    firm_id,
    email,
    first_name,
    last_name,
    role,
    department,
    invited_by,
    token,
    expires_at
  ) VALUES (
    v_firm_id,
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    p_department,
    auth.uid(),
    v_token,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_invitation_id;

  -- Return success with invitation details
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'expires_at', NOW() + INTERVAL '7 days'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION create_employee_invitation(TEXT, TEXT, TEXT, app_role, TEXT) TO authenticated;

-- ============================================================================
-- 5. FUNCTION: Accept employee invitation
-- ============================================================================
CREATE OR REPLACE FUNCTION accept_employee_invitation(
  p_token TEXT,
  p_password TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation user_invitations%ROWTYPE;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM user_invitations
  WHERE token = p_token
  AND accepted_at IS NULL
  AND expires_at > NOW();

  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Check if email is already registered
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = v_invitation.email
  ) THEN
    -- If user exists, just add them to the firm
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_invitation.email;

    -- Update profile with firm
    UPDATE profiles
    SET firm_id = v_invitation.firm_id,
        department = COALESCE(v_invitation.department, department),
        first_name = COALESCE(p_first_name, v_invitation.first_name, first_name),
        last_name = COALESCE(p_last_name, v_invitation.last_name, last_name)
    WHERE id = v_user_id;
  END IF;

  -- Assign role
  INSERT INTO user_roles (user_id, firm_id, role, assigned_by)
  VALUES (v_user_id, v_invitation.firm_id, v_invitation.role, v_invitation.invited_by)
  ON CONFLICT (user_id, role, firm_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invitation accepted successfully',
    'requires_signup', v_user_id IS NULL,
    'email', v_invitation.email,
    'role', v_invitation.role
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION accept_employee_invitation(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 6. FUNCTION: Get invitation details (for pre-filling form)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_invitation_details(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'success', true,
    'email', ui.email,
    'first_name', ui.first_name,
    'last_name', ui.last_name,
    'role', ui.role,
    'firm_name', f.name,
    'department', ui.department,
    'expires_at', ui.expires_at,
    'is_expired', ui.expires_at < NOW(),
    'is_accepted', ui.accepted_at IS NOT NULL
  ) INTO v_result
  FROM user_invitations ui
  JOIN firms f ON f.id = ui.firm_id
  WHERE ui.token = p_token;

  IF v_result IS NULL THEN
    -- Check client invitations
    SELECT jsonb_build_object(
      'success', true,
      'email', ci.email,
      'first_name', ci.first_name,
      'last_name', ci.last_name,
      'role', ci.role,
      'firm_name', f.name,
      'company_name', ci.company_name,
      'expires_at', ci.expires_at,
      'is_expired', ci.expires_at < NOW(),
      'is_accepted', ci.accepted_at IS NOT NULL,
      'is_client', true
    ) INTO v_result
    FROM client_invitations ci
    JOIN firms f ON f.id = ci.firm_id
    WHERE ci.token = p_token;
  END IF;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitation not found'
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_invitation_details(TEXT) TO anon, authenticated;

-- ============================================================================
-- 7. FUNCTION: Create client invitation
-- ============================================================================
CREATE OR REPLACE FUNCTION create_client_invitation(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_company_name TEXT,
  p_role app_role,
  p_client_id UUID DEFAULT NULL,
  p_engagement_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_invitation_id UUID;
  v_token TEXT;
  v_result JSONB;
BEGIN
  -- Get the firm_id of the inviting user
  SELECT firm_id INTO v_firm_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_firm_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not associated with a firm'
    );
  END IF;

  -- Generate secure token
  v_token := generate_invitation_token();

  -- Create invitation
  INSERT INTO client_invitations (
    firm_id,
    client_id,
    engagement_id,
    email,
    first_name,
    last_name,
    company_name,
    role,
    invited_by,
    token,
    expires_at
  ) VALUES (
    v_firm_id,
    p_client_id,
    p_engagement_id,
    p_email,
    p_first_name,
    p_last_name,
    p_company_name,
    p_role,
    auth.uid(),
    v_token,
    NOW() + INTERVAL '14 days'
  )
  RETURNING id INTO v_invitation_id;

  -- Return success with invitation details
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'expires_at', NOW() + INTERVAL '14 days'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION create_client_invitation(TEXT, TEXT, TEXT, TEXT, app_role, UUID, UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE user_invitations IS 'Stores invitations for firm employees';
COMMENT ON TABLE client_invitations IS 'Stores invitations for client portal access';
COMMENT ON FUNCTION create_employee_invitation IS 'Creates a new employee invitation (firm admins only)';
COMMENT ON FUNCTION accept_employee_invitation IS 'Accepts an employee invitation and assigns role';
COMMENT ON FUNCTION get_invitation_details IS 'Retrieves invitation details for pre-filling acceptance form';
COMMENT ON FUNCTION create_client_invitation IS 'Creates a new client portal invitation';
