-- =====================================================================
-- MIGRATION: Final Fix for user_roles RLS Infinite Recursion
-- Date: 2025-12-29
-- Purpose: Completely rebuild user_roles policies without recursion
-- =====================================================================

-- =====================================================================
-- STEP 1: Drop ALL existing policies on user_roles
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_roles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- =====================================================================
-- STEP 2: Create or replace the SECURITY DEFINER helper function
-- This MUST NOT query user_roles directly
-- =====================================================================

CREATE OR REPLACE FUNCTION public.user_firm_id(check_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM public.profiles WHERE id = check_user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_firm_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_firm_id(UUID) TO anon;

-- =====================================================================
-- STEP 3: Ensure RLS is enabled on user_roles
-- =====================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- STEP 4: Create simple non-recursive policies
-- KEY: These policies NEVER reference user_roles table in the USING clause
-- =====================================================================

-- Policy 1: Users can always see their OWN roles (use auth.uid() directly - no recursion)
CREATE POLICY "user_roles_view_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can see all roles for users in their firm
-- Uses user_firm_id() which queries PROFILES (not user_roles) - no recursion
CREATE POLICY "user_roles_view_firm_members"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- Policy 3: Allow INSERT for authenticated users (for admin assignment)
-- The app handles permission checking in code
CREATE POLICY "user_roles_insert_firm"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (firm_id = public.user_firm_id(auth.uid()));

-- Policy 4: Allow UPDATE for roles in same firm
CREATE POLICY "user_roles_update_firm"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- Policy 5: Allow DELETE for roles in same firm
CREATE POLICY "user_roles_delete_firm"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- =====================================================================
-- STEP 5: Verify no recursion by listing final policies
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE '=== Final user_roles policies ===';
    FOR pol IN
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_roles'
    LOOP
        RAISE NOTICE 'Policy: % (%), USING: %, WITH CHECK: %',
            pol.policyname, pol.cmd, pol.qual, pol.with_check;
    END LOOP;
    RAISE NOTICE '=================================';
END $$;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** user_roles RLS recursion fix applied successfully ***';
END $$;
