-- Validation queries to confirm the RLS fix worked

-- 1. Check all users have firm_id
SELECT
  COUNT(*) as total_profiles,
  COUNT(firm_id) as profiles_with_firm,
  COUNT(*) - COUNT(firm_id) as orphaned_profiles
FROM profiles;

-- 2. Check the specific policies on clients table
SELECT
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY cmd;

-- 3. Verify user_firms() function exists and works
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'user_firms';

-- 4. Check for any remaining organization_id columns
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'organization_id';

-- 5. Verify firms table exists
SELECT COUNT(*) as firm_count
FROM firms;
