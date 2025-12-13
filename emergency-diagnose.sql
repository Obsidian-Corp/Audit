-- EMERGENCY DIAGNOSIS - Check current user state

-- 1. Check current user's profile and firm_id
SELECT
  id,
  email,
  firm_id,
  first_name,
  last_name
FROM profiles
WHERE id = auth.uid();

-- 2. Check if current user has ANY roles assigned
SELECT
  ur.user_id,
  ur.firm_id,
  ur.role,
  ur.assigned_at
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- 3. Test if user_firms() returns anything
SELECT * FROM public.user_firms();

-- 4. Check the INSERT policy on clients
SELECT
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'clients'
AND cmd = 'INSERT';

-- 5. Count total users vs users with roles
SELECT
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles) as profiles_with_roles;
