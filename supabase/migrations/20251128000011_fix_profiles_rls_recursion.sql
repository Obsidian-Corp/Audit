-- Fix recursive RLS policy on profiles table
-- The current policy queries profiles from within profiles, causing a 500 error

-- Step 1: Create a helper function that bypasses RLS to get user's firm_id
CREATE OR REPLACE FUNCTION public.get_user_firm_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM public.profiles WHERE id = user_id;
$$;

-- Step 2: Drop the problematic recursive policy
DROP POLICY IF EXISTS "Firm members can view firm profiles" ON public.profiles;

-- Step 3: Recreate it using the helper function (no recursion)
CREATE POLICY "Firm members can view firm profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    firm_id IS NOT NULL
    AND firm_id = public.get_user_firm_id(auth.uid())
  );

COMMENT ON FUNCTION public.get_user_firm_id IS 'Helper function to get user firm_id without triggering RLS recursion';
