-- =============================================================================
-- Pre-Deployment Verification Script
-- Run this BEFORE deploying the RLS migration to capture current state
-- =============================================================================

-- 1. Current RLS policy count per table
SELECT
  schemaname,
  tablename,
  count(*) as policy_count,
  array_agg(policyname ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 2. List of all public tables
SELECT
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. RLS enabled status for all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Count of policies by operation type
SELECT
  cmd as operation,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY cmd
ORDER BY cmd;

-- 5. Tables without any RLS policies (vulnerable)
SELECT
  t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- 6. Tables with RLS enabled but no policies (locked down)
SELECT
  t.tablename,
  t.rowsecurity
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- 7. Check if user_firms() function exists
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'user_firms';

-- 8. Sample firm_id values from key tables (for testing)
SELECT 'clients' as table_name, count(DISTINCT firm_id) as distinct_firms FROM clients
UNION ALL
SELECT 'engagements', count(DISTINCT firm_id) FROM engagements
UNION ALL
SELECT 'audit_programs', count(DISTINCT firm_id) FROM audit_programs
UNION ALL
SELECT 'profiles', count(DISTINCT firm_id) FROM profiles;

-- 9. Check for any existing policies with 'firm_members' naming pattern
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%firm_members%'
ORDER BY tablename, policyname;

-- 10. Check database version and extensions
SELECT version();
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_stat_statements');
