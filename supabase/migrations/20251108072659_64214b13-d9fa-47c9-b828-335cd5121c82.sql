-- Fix ambiguous id reference in create_platform_admin_user by qualifying RETURNING
CREATE OR REPLACE FUNCTION public.create_platform_admin_user(
  _email text,
  _username text,
  _full_name text,
  _password_hash text
)
RETURNS TABLE(id uuid, email text, username text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _admin_id uuid;
  _existing_count integer;
BEGIN
  -- Prevent creating if an active platform admin role already exists
  SELECT COUNT(*) INTO _existing_count
  FROM platform_admin.admin_roles
  WHERE role = 'platform_admin'
    AND (expires_at IS NULL OR expires_at > now());

  IF _existing_count > 0 THEN
    RAISE EXCEPTION 'Platform admin already exists';
  END IF;

  -- Insert admin user with qualified RETURNING to avoid ambiguity
  INSERT INTO platform_admin.admin_users AS au (
    email,
    username,
    full_name,
    password_hash,
    is_active,
    mfa_enabled
  ) VALUES (
    _email,
    _username,
    _full_name,
    _password_hash,
    true,
    false
  ) RETURNING au.id INTO _admin_id;

  -- Return basic profile of the new admin
  RETURN QUERY
  SELECT au.id, au.email, au.username, au.full_name
  FROM platform_admin.admin_users au
  WHERE au.id = _admin_id;
END;
$$;