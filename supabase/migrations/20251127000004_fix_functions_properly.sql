-- COMPREHENSIVE FIX: Recreate ALL platform admin functions with correct table schemas
-- The previous migration (20251127000003) had wrong table structures
-- This migration uses the ACTUAL table structures from the database

-- ============================================================================
-- Drop all functions first (required to change return types)
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_platform_access_logs(INTEGER);
DROP FUNCTION IF EXISTS public.get_schema_boundary_logs(INTEGER);
DROP FUNCTION IF EXISTS public.get_data_classifications();
DROP FUNCTION IF EXISTS public.get_platform_admin_roles();
DROP FUNCTION IF EXISTS public.get_platform_metrics();

-- ============================================================================
-- Fix 1: Recreate get_platform_access_logs with CORRECT signature
-- ============================================================================
CREATE FUNCTION public.get_platform_access_logs(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  admin_user_id UUID,
  accessed_schema TEXT,
  accessed_table TEXT,
  accessed_organization_id UUID,
  action TEXT,
  success BOOLEAN,
  reason TEXT,
  created_at TIMESTAMPTZ,
  admin_name TEXT,
  admin_email TEXT,
  org_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.admin_user_id,
    al.accessed_schema,
    al.accessed_table,
    al.accessed_organization_id,
    al.action,
    al.success,
    al.reason,
    al.created_at,
    p.full_name as admin_name,
    p.email as admin_email,
    o.name as org_name
  FROM platform_admin.access_logs al
  LEFT JOIN public.profiles p ON p.id = al.admin_user_id
  LEFT JOIN public.organizations o ON o.id = al.accessed_organization_id
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- Fix 2: Recreate get_schema_boundary_logs with correct structure
-- ============================================================================
CREATE FUNCTION public.get_schema_boundary_logs(limit_count INTEGER DEFAULT 15)
RETURNS TABLE (
  id UUID,
  admin_user_id UUID,
  operation TEXT,
  source_schema TEXT,
  target_schema TEXT,
  target_table TEXT,
  approved BOOLEAN,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  admin_name TEXT,
  admin_email TEXT,
  approver_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sbl.id,
    sbl.admin_user_id,
    sbl.operation,
    sbl.source_schema,
    sbl.target_schema,
    sbl.target_table,
    sbl.approved,
    sbl.approved_by,
    sbl.approved_at,
    sbl.approval_reason,
    sbl.metadata,
    sbl.created_at,
    p.full_name as admin_name,
    p.email as admin_email,
    ap.full_name as approver_name
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.admin_user_id
  LEFT JOIN public.profiles ap ON ap.id = sbl.approved_by
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- Fix 3: Recreate get_data_classifications (keeping from previous migration)
-- ============================================================================
CREATE FUNCTION public.get_data_classifications()
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  column_name TEXT,
  classification_level TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.table_name,
    dc.column_name,
    dc.classification_level,
    dc.metadata,
    dc.created_at
  FROM platform_admin.data_classifications dc
  ORDER BY dc.table_name, dc.column_name;
END;
$$;

-- ============================================================================
-- Fix 4: Recreate get_platform_admin_roles using actual admin_users table
-- ============================================================================
CREATE FUNCTION public.get_platform_admin_roles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.id as user_id,
    au.username,
    au.email,
    au.full_name,
    au.is_active,
    au.last_login_at,
    au.created_at,
    au.updated_at
  FROM platform_admin.admin_users au
  ORDER BY au.created_at DESC;
END;
$$;

-- ============================================================================
-- Fix 5: Recreate get_platform_metrics with correct counts
-- ============================================================================
CREATE FUNCTION public.get_platform_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_admins', (
      SELECT COUNT(*)
      FROM platform_admin.admin_users
      WHERE is_active = TRUE
    ),
    'recent_access_count', (
      SELECT COUNT(*)
      FROM platform_admin.access_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    ),
    'pending_boundaries', (
      SELECT COUNT(*)
      FROM platform_admin.schema_boundary_logs
      WHERE approved = FALSE
    ),
    'classified_tables', (
      SELECT COUNT(DISTINCT table_name)
      FROM platform_admin.data_classifications
    ),
    'total_organizations', (
      SELECT COUNT(*)
      FROM public.firms
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_platform_admin_roles() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_access_logs(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_schema_boundary_logs(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_data_classifications() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_metrics() TO authenticated, anon;
