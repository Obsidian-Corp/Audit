-- ============================================================================
-- PALANTIR-LEVEL AUTH SEPARATION: DATABASE FUNCTION FIXES
-- This migration ensures complete separation between client and admin auth
-- ============================================================================

-- Drop the old is_first_run function that checks the wrong table
DROP FUNCTION IF EXISTS public.is_first_run();

-- Create check_admin_bootstrap_needed function
-- ONLY checks platform_admin.admin_users (NOT admin_roles)
CREATE OR REPLACE FUNCTION public.check_admin_bootstrap_needed()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM platform_admin.admin_users 
    WHERE is_active = true
  );
$$;

COMMENT ON FUNCTION public.check_admin_bootstrap_needed() IS 
'Checks if platform admin bootstrap is needed. Returns true if no active admin users exist in platform_admin.admin_users table.';
