-- Fix search path for validation function
CREATE OR REPLACE FUNCTION platform_admin.validate_invitation_token(_token TEXT)
RETURNS TABLE (
  invitation_id UUID,
  invited_email TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
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

-- Fix search path for accept invitation function
CREATE OR REPLACE FUNCTION platform_admin.accept_invitation(
  _token TEXT,
  _user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
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