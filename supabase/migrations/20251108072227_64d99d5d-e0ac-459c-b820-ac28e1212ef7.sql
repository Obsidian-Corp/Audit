-- ============================================================================
-- PLATFORM ADMIN RPC FUNCTIONS
-- These RPCs provide SECURITY DEFINER access to platform_admin schema
-- All platform admin operations MUST go through these RPCs
-- ============================================================================

-- RPC: Get admin user by email or username
CREATE OR REPLACE FUNCTION public.get_admin_user(_identifier text)
RETURNS TABLE(
  id uuid,
  email text,
  username text,
  full_name text,
  is_active boolean,
  locked_until timestamptz,
  failed_login_attempts integer,
  mfa_enabled boolean,
  password_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  -- Try email first
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.username,
    au.full_name,
    au.is_active,
    au.locked_until,
    au.failed_login_attempts,
    au.mfa_enabled,
    au.password_hash
  FROM platform_admin.admin_users au
  WHERE au.email = _identifier
  LIMIT 1;
  
  -- If not found by email, try username
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.username,
      au.full_name,
      au.is_active,
      au.locked_until,
      au.failed_login_attempts,
      au.mfa_enabled,
      au.password_hash
    FROM platform_admin.admin_users au
    WHERE au.username = _identifier
    LIMIT 1;
  END IF;
END;
$$;

-- RPC: Get admin user by ID (for session validation)
CREATE OR REPLACE FUNCTION public.get_admin_user_by_id(_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  username text,
  full_name text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.username,
    au.full_name,
    au.is_active
  FROM platform_admin.admin_users au
  WHERE au.id = _id;
END;
$$;

-- RPC: Increment failed login attempts
CREATE OR REPLACE FUNCTION public.increment_failed_login(_admin_id uuid)
RETURNS TABLE(
  failed_login_attempts integer,
  locked_until timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _new_attempts integer;
  _lock_until timestamptz;
BEGIN
  -- Get current attempts
  SELECT au.failed_login_attempts + 1 INTO _new_attempts
  FROM platform_admin.admin_users au
  WHERE au.id = _admin_id;
  
  -- Lock account if >= 5 attempts
  IF _new_attempts >= 5 THEN
    _lock_until := now() + interval '30 minutes';
  ELSE
    _lock_until := NULL;
  END IF;
  
  -- Update
  UPDATE platform_admin.admin_users
  SET 
    failed_login_attempts = _new_attempts,
    locked_until = _lock_until
  WHERE id = _admin_id;
  
  RETURN QUERY SELECT _new_attempts, _lock_until;
END;
$$;

-- RPC: Reset failed login and update last login
CREATE OR REPLACE FUNCTION public.reset_failed_login_and_update_last_login(_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  UPDATE platform_admin.admin_users
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    last_login_at = now()
  WHERE id = _admin_id;
END;
$$;

-- RPC: Create admin session
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
    _ip_address,
    _user_agent,
    _expires_at,
    now()
  );
  
  RETURN QUERY SELECT _session_token, _expires_at;
END;
$$;

-- RPC: Revoke admin session
CREATE OR REPLACE FUNCTION public.revoke_admin_session(
  _session_token text,
  _reason text DEFAULT 'User logout'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  UPDATE platform_admin.admin_sessions
  SET 
    revoked = true,
    revoked_reason = _reason,
    revoked_at = now()
  WHERE session_token = _session_token
    AND revoked = false;
  
  RETURN FOUND;
END;
$$;

-- RPC: Update admin session activity
CREATE OR REPLACE FUNCTION public.update_admin_session_activity(_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  UPDATE platform_admin.admin_sessions
  SET last_activity = now()
  WHERE session_token = _session_token
    AND revoked = false
    AND expires_at > now();
  
  RETURN FOUND;
END;
$$;