-- Diagnostic queries to check RLS issue

-- 1. Check current user's profile and firm_id
SELECT
  id,
  email,
  firm_id,
  first_name,
  last_name
FROM auth.users
WHERE id = auth.uid();

-- 2. Check if user has a profile
SELECT
  id,
  firm_id,
  first_name,
  last_name
FROM profiles
WHERE id = auth.uid();

-- 3. Test the user_firms() function
SELECT * FROM public.user_firms();

-- 4. Check existing RLS policies on clients table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clients';

-- 5. Check if there's a firm the user belongs to
SELECT
  f.id,
  f.firm_name,
  f.slug
FROM firms f
JOIN profiles p ON p.firm_id = f.id
WHERE p.id = auth.uid();
