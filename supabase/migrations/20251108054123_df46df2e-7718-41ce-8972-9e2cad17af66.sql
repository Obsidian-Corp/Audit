-- Function to detect if this is the first run (no platform admins exist)
CREATE OR REPLACE FUNCTION public.is_first_run()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'platform_admin'::app_role 
    AND organization_id IS NULL
  );
$$;

-- Create schema for platform admin specific tables if not exists
CREATE SCHEMA IF NOT EXISTS platform_admin;

-- Admin invitations table for subsequent admin onboarding
CREATE TABLE platform_admin.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  invited_email TEXT NOT NULL,
  invited_by_admin_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID,
  revoked_at TIMESTAMPTZ,
  revoked_by_admin_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on admin invitations
ALTER TABLE platform_admin.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view and manage invitations
CREATE POLICY "Platform admins can manage invitations"
ON platform_admin.admin_invitations
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- Public can view their own invitation by token (for acceptance page)
CREATE POLICY "Anyone can view invitation by token"
ON platform_admin.admin_invitations
FOR SELECT
TO anon, authenticated
USING (
  expires_at > now() 
  AND accepted_at IS NULL 
  AND revoked_at IS NULL
);

-- Function to validate and consume invitation token
CREATE OR REPLACE FUNCTION platform_admin.validate_invitation_token(_token TEXT)
RETURNS TABLE (
  invitation_id UUID,
  invited_email TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id,
    ai.invited_email,
    (ai.expires_at > now() AND ai.accepted_at IS NULL AND ai.revoked_at IS NULL) as is_valid
  FROM platform_admin.admin_invitations ai
  WHERE ai.token = _token;
END;
$$;

-- Function to accept invitation and create platform admin role
CREATE OR REPLACE FUNCTION platform_admin.accept_invitation(
  _token TEXT,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _invitation_id UUID;
  _invited_email TEXT;
  _is_valid BOOLEAN;
BEGIN
  -- Validate token
  SELECT invitation_id, invited_email, is_valid
  INTO _invitation_id, _invited_email, _is_valid
  FROM platform_admin.validate_invitation_token(_token);
  
  IF NOT _is_valid THEN
    RETURN FALSE;
  END IF;
  
  -- Mark invitation as accepted
  UPDATE platform_admin.admin_invitations
  SET 
    accepted_at = now(),
    accepted_by_user_id = _user_id
  WHERE id = _invitation_id;
  
  -- Create platform admin role
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (_user_id, 'platform_admin'::app_role, NULL)
  ON CONFLICT (user_id, role, organization_id) DO NOTHING;
  
  -- Log the acceptance
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    _user_id,
    'platform_admin_invitation_accepted',
    'admin_invitation',
    _invitation_id,
    jsonb_build_object('invited_email', _invited_email)
  );
  
  RETURN TRUE;
END;
$$;

-- Add index for token lookups
CREATE INDEX idx_admin_invitations_token ON platform_admin.admin_invitations(token);
CREATE INDEX idx_admin_invitations_email ON platform_admin.admin_invitations(invited_email);