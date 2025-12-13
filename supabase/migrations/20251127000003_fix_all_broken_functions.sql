-- Fix ALL Broken Platform Admin Functions
-- Recreates functions to reference correct tables/columns

-- ============================================================================
-- Ensure required tables exist first
-- ============================================================================

-- Ensure access_logs exists
CREATE TABLE IF NOT EXISTS platform_admin.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure schema_boundary_logs exists
CREATE TABLE IF NOT EXISTS platform_admin.schema_boundary_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  source_schema TEXT NOT NULL,
  target_schema TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure data_classifications exists
CREATE TABLE IF NOT EXISTS platform_admin.data_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT,
  classification_level TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure admin_users has full_name column (computed from username if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'platform_admin'
      AND table_name = 'admin_users'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE platform_admin.admin_users
    ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
      COALESCE(username, email)
    ) STORED;
  END IF;
END $$;

-- ============================================================================
-- Now fix the functions
-- ============================================================================

-- ============================================================================
-- Fix 1: Recreate get_platform_admin_roles to use admin_users instead
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_platform_admin_roles();
CREATE OR REPLACE FUNCTION public.get_platform_admin_roles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  role TEXT,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return admin_users data (no separate roles table for platform admins)
  RETURN QUERY
  SELECT
    au.id,
    au.id as user_id,
    'platform_admin'::TEXT as role,
    NULL::UUID as assigned_by,
    au.created_at as assigned_at,
    NULL::TIMESTAMPTZ as expires_at,
    '{}'::JSONB as metadata,
    au.created_at,
    au.updated_at,
    au.full_name,
    au.email
  FROM platform_admin.admin_users au
  WHERE au.is_active = TRUE
  ORDER BY au.created_at DESC;
END;
$$;

-- ============================================================================
-- Fix 2: Recreate get_platform_access_logs with correct schema
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_platform_access_logs(INTEGER);
CREATE OR REPLACE FUNCTION public.get_platform_access_logs(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  admin_user_id UUID,
  action TEXT,
  resource TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  admin_name TEXT,
  admin_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.admin_user_id,
    al.action,
    al.resource,
    al.metadata,
    al.created_at,
    au.full_name as admin_name,
    au.email as admin_email
  FROM platform_admin.access_logs al
  LEFT JOIN platform_admin.admin_users au ON au.id = al.admin_user_id
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- Fix 3: Recreate get_schema_boundary_logs with correct schema
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_schema_boundary_logs(INTEGER);
CREATE OR REPLACE FUNCTION public.get_schema_boundary_logs(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  operation TEXT,
  source_schema TEXT,
  target_schema TEXT,
  approved BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sbl.id,
    sbl.operation,
    sbl.source_schema,
    sbl.target_schema,
    sbl.approved,
    sbl.metadata,
    sbl.created_at
  FROM platform_admin.schema_boundary_logs sbl
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- Fix 4: Recreate get_data_classifications with correct schema
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_data_classifications();
CREATE OR REPLACE FUNCTION public.get_data_classifications()
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
-- Fix 5: Recreate get_platform_metrics with correct references
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_platform_metrics();
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
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
