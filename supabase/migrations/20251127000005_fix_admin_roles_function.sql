-- Fix get_platform_admin_roles to return fields that match AdminRolesList component expectations

DROP FUNCTION IF EXISTS public.get_platform_admin_roles();

CREATE FUNCTION public.get_platform_admin_roles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role TEXT,
  assigned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  full_name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.id as user_id,
    'platform_admin'::TEXT as role,
    au.created_at as assigned_at,
    NULL::TIMESTAMPTZ as expires_at,
    '{}'::JSONB as metadata,
    au.full_name,
    au.email
  FROM platform_admin.admin_users au
  WHERE au.is_active = TRUE
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_admin_roles() TO authenticated, anon;
