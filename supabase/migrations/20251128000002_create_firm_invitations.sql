-- Create firm invitations table
-- Platform admins use this to invite new firms to the platform

-- Ensure pgcrypto extension is available for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.firm_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES platform_admin.admin_users(id) ON DELETE SET NULL,
  firm_name TEXT NOT NULL,
  firm_type TEXT CHECK (firm_type IN ('solo', 'small', 'regional', 'national', 'international')),
  admin_email TEXT NOT NULL,
  admin_first_name TEXT,
  admin_last_name TEXT,
  admin_job_title TEXT DEFAULT 'Managing Partner',
  token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at TIMESTAMPTZ,
  created_firm_id UUID REFERENCES public.firms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_firm_invitations_token ON public.firm_invitations(token);
CREATE INDEX IF NOT EXISTS idx_firm_invitations_email ON public.firm_invitations(admin_email);
CREATE INDEX IF NOT EXISTS idx_firm_invitations_invited_by ON public.firm_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_firm_invitations_expires_at ON public.firm_invitations(expires_at);

-- Enable RLS
ALTER TABLE public.firm_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only platform admins can manage firm invitations)
-- Note: These policies check platform_admin.admin_users, not auth.users

DROP POLICY IF EXISTS "Platform admins can view all firm invitations" ON public.firm_invitations;
CREATE POLICY "Platform admins can view all firm invitations"
  ON public.firm_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Platform admins can create firm invitations" ON public.firm_invitations;
CREATE POLICY "Platform admins can create firm invitations"
  ON public.firm_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Platform admins can update firm invitations" ON public.firm_invitations;
CREATE POLICY "Platform admins can update firm invitations"
  ON public.firm_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND is_active = true
    )
  );

-- Function to create firm invitation (called by platform admin)
CREATE OR REPLACE FUNCTION public.create_firm_invitation(
  p_firm_name TEXT,
  p_firm_type TEXT,
  p_admin_email TEXT,
  p_admin_first_name TEXT DEFAULT NULL,
  p_admin_last_name TEXT DEFAULT NULL,
  p_admin_job_title TEXT DEFAULT 'Managing Partner'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_token TEXT;
BEGIN
  -- Generate unique token
  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  -- Create invitation
  INSERT INTO public.firm_invitations (
    firm_name,
    firm_type,
    admin_email,
    admin_first_name,
    admin_last_name,
    admin_job_title,
    token,
    expires_at
  ) VALUES (
    p_firm_name,
    p_firm_type,
    p_admin_email,
    p_admin_first_name,
    p_admin_last_name,
    p_admin_job_title,
    v_token,
    now() + interval '30 days'
  )
  RETURNING id INTO v_invitation_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'expires_at', (now() + interval '30 days')::text
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to get firm invitation details (for acceptance page)
CREATE OR REPLACE FUNCTION public.get_firm_invitation_details(
  p_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.firm_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid invitation token'
    );
  END IF;

  -- Check if already accepted
  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invitation has already been accepted',
      'is_accepted', true
    );
  END IF;

  -- Check if expired
  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This invitation has expired',
      'is_expired', true
    );
  END IF;

  -- Return invitation details
  RETURN jsonb_build_object(
    'success', true,
    'firm_name', v_invitation.firm_name,
    'firm_type', v_invitation.firm_type,
    'admin_email', v_invitation.admin_email,
    'admin_first_name', v_invitation.admin_first_name,
    'admin_last_name', v_invitation.admin_last_name,
    'admin_job_title', v_invitation.admin_job_title,
    'expires_at', v_invitation.expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to mark invitation as accepted
CREATE OR REPLACE FUNCTION public.mark_firm_invitation_accepted(
  p_token TEXT,
  p_firm_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.firm_invitations
  SET
    accepted_at = now(),
    created_firm_id = p_firm_id,
    updated_at = now()
  WHERE token = p_token
  AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitation not found or already accepted'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_firm_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_firm_invitation_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_firm_invitation_accepted TO authenticated;

-- Add comments
COMMENT ON TABLE public.firm_invitations IS 'Platform admin invitations for new firms to join the platform';
COMMENT ON FUNCTION public.create_firm_invitation IS 'Platform admin creates invitation for new firm';
COMMENT ON FUNCTION public.get_firm_invitation_details IS 'Get invitation details for acceptance page (public access)';
COMMENT ON FUNCTION public.mark_firm_invitation_accepted IS 'Mark invitation as accepted after firm is created';
