-- Fix create_admin_session to cast text IP to inet
CREATE OR REPLACE FUNCTION public.create_admin_session(
  _admin_user_id uuid,
  _session_token text,
  _ip_address text,
  _user_agent text,
  _expires_minutes integer DEFAULT 30
)
RETURNS TABLE(
  session_token text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _expires_at timestamptz;
BEGIN
  _expires_at := now() + (_expires_minutes || ' minutes')::interval;
  
  INSERT INTO platform_admin.admin_sessions (
    admin_user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at,
    last_activity
  ) VALUES (
    _admin_user_id,
    _session_token,
    COALESCE(NULLIF(_ip_address, ''), '0.0.0.0')::inet,
    _user_agent,
    _expires_at,
    now()
  );
  
  RETURN QUERY SELECT _session_token, _expires_at;
END;
$$;