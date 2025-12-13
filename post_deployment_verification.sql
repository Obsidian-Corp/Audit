-- =============================================================================
-- Post-Deployment Verification Script
-- Run this AFTER deploying the RLS migration to verify success
-- =============================================================================

-- 1. Verify all new policies are in place
SELECT
  tablename,
  count(*) as policy_count,
  array_agg(policyname ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'firm_members_%'
GROUP BY tablename
ORDER BY tablename;

-- 2. Count policies per table (should be 3 for most tables: INSERT, UPDATE, DELETE)
SELECT
  tablename,
  count(*) as total_policies,
  count(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  count(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  count(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  count(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Tables that don't have all CRUD operations covered
SELECT
  tablename,
  array_agg(DISTINCT cmd ORDER BY cmd) as operations_covered,
  CASE
    WHEN count(DISTINCT cmd) < 4 THEN 'INCOMPLETE'
    ELSE 'COMPLETE'
  END as crud_status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING count(DISTINCT cmd) < 4
ORDER BY tablename;

-- 4. Verify user_firms() function exists and is correct
SELECT
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  p.provolatile as volatility,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'user_firms';

-- 5. Verify RLS is enabled on all tables with policies
SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  count(p.policyname) as policy_count,
  CASE
    WHEN t.rowsecurity = true THEN 'OK'
    ELSE 'WARNING: RLS NOT ENABLED'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
HAVING count(p.policyname) > 0
ORDER BY t.rowsecurity, t.tablename;

-- 6. Check for any policy conflicts or duplicates
SELECT
  tablename,
  cmd,
  count(*) as policy_count,
  array_agg(policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING count(*) > 1
ORDER BY tablename, cmd;

-- 7. Detailed policy information for key tables
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'engagements', 'audit_programs', 'audit_procedures')
ORDER BY tablename, cmd, policyname;

-- 8. Check if tests schema was created
SELECT
  nspname as schema_name,
  nspowner::regrole as owner
FROM pg_namespace
WHERE nspname = 'tests';

-- 9. Check if test functions exist
SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'tests'
ORDER BY p.proname;

-- 10. Quick policy syntax check for common tables
-- This will fail if policies are malformed
EXPLAIN SELECT * FROM clients WHERE firm_id = '00000000-0000-0000-0000-000000000000';
EXPLAIN SELECT * FROM engagements WHERE firm_id = '00000000-0000-0000-0000-000000000000';
EXPLAIN SELECT * FROM audit_programs WHERE firm_id = '00000000-0000-0000-0000-000000000000';
