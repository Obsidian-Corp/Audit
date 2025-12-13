-- Fix security warnings by setting search_path on all platform_admin functions

-- Fix validate_admin_session function
CREATE OR REPLACE FUNCTION platform_admin.validate_admin_session(
  _session_token text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM platform_admin.admin_sessions
    WHERE session_token = _session_token
      AND user_id = _user_id
      AND NOT revoked
      AND expires_at > now()
      AND last_activity > now() - interval '30 minutes'
  );
END;
$$;

-- Fix log_admin_auth_attempt function
CREATE OR REPLACE FUNCTION platform_admin.log_admin_auth_attempt(
  _user_id uuid,
  _attempt_type text,
  _success boolean,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _failure_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO platform_admin.admin_auth_logs (
    user_id,
    attempt_type,
    success,
    ip_address,
    user_agent,
    failure_reason
  ) VALUES (
    _user_id,
    _attempt_type,
    _success,
    _ip_address,
    _user_agent,
    _failure_reason
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Fix is_ip_whitelisted function
CREATE OR REPLACE FUNCTION platform_admin.is_ip_whitelisted(_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  -- If no whitelist entries exist, allow all IPs
  IF NOT EXISTS (SELECT 1 FROM platform_admin.admin_ip_whitelist WHERE enabled = true) THEN
    RETURN true;
  END IF;
  
  -- Check if IP is in whitelist
  RETURN EXISTS (
    SELECT 1 
    FROM platform_admin.admin_ip_whitelist
    WHERE enabled = true
      AND _ip_address <<= ip_range
  );
END;
$$;

-- Fix create_admin_session function
CREATE OR REPLACE FUNCTION platform_admin.create_admin_session(
  _user_id uuid,
  _ip_address inet,
  _user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _session_token text;
  _expires_at timestamptz;
BEGIN
  -- Generate session token
  _session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Set expiration (30 minutes from now)
  _expires_at := now() + interval '30 minutes';
  
  -- Create session
  INSERT INTO platform_admin.admin_sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    _user_id,
    _session_token,
    _ip_address,
    _user_agent,
    _expires_at
  );
  
  RETURN _session_token;
END;
$$;