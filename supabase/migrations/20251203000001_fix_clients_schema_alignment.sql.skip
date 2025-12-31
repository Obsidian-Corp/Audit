-- ===========================================================================
-- Migration: Fix Client Creation 403 Error - Schema Alignment
-- Version: 20251203000001
-- Description: Aligns clients table schema with profiles/firms architecture
-- ===========================================================================

-- Step 1: Ensure we know which architecture exists
DO $$
BEGIN
  -- Check if we have 'firms' or 'organizations' table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN
    RAISE NOTICE 'Using FIRMS architecture';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    RAISE NOTICE 'Using ORGANIZATIONS architecture - will create firms as alias';

    -- If organizations exists but not firms, create firms as view or rename
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN
      ALTER TABLE organizations RENAME TO firms;
      RAISE NOTICE 'Renamed organizations to firms';
    END IF;
  ELSE
    RAISE EXCEPTION 'Neither firms nor organizations table exists!';
  END IF;
END $$;

-- Step 2: Fix clients table to use firm_id
DO $$
BEGIN
  -- Check if clients has organization_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients'
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Clients table has organization_id, renaming to firm_id';
    ALTER TABLE clients RENAME COLUMN organization_id TO firm_id;
  END IF;

  -- Verify firm_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients'
    AND column_name = 'firm_id'
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Clients table is missing firm_id column!';
  END IF;
END $$;

-- Step 3: Fix organization_members if it exists (should be using firms)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members' AND table_schema = 'public') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'organization_id') THEN
      ALTER TABLE organization_members RENAME COLUMN organization_id TO firm_id;
      RAISE NOTICE 'Renamed organization_members.organization_id to firm_id';
    END IF;
  END IF;
END $$;

-- Step 4: Recreate user_firms() function to be robust
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

-- Step 5: Drop ALL conflicting policies on clients
DROP POLICY IF EXISTS "Organization members can view clients" ON clients;
DROP POLICY IF EXISTS "Organization members can insert clients" ON clients;
DROP POLICY IF EXISTS "Organization members can update clients" ON clients;
DROP POLICY IF EXISTS "Admins and partners can delete clients" ON clients;
DROP POLICY IF EXISTS "Leaders can insert clients" ON clients;
DROP POLICY IF EXISTS "Leaders can update clients" ON clients;
DROP POLICY IF EXISTS "Leaders can delete clients" ON clients;
DROP POLICY IF EXISTS "Leaders can manage clients" ON clients;
DROP POLICY IF EXISTS "Leaders manage clients" ON clients;
DROP POLICY IF EXISTS "Firm members see clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients in their firm" ON clients;
DROP POLICY IF EXISTS "Users can view their org clients" ON clients;
DROP POLICY IF EXISTS "Users can manage their org clients" ON clients;
DROP POLICY IF EXISTS "firm_members_insert_clients" ON clients;
DROP POLICY IF EXISTS "firm_members_update_clients" ON clients;
DROP POLICY IF EXISTS "firm_members_delete_clients" ON clients;
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON clients;
DROP POLICY IF EXISTS "temp_allow_all_authenticated_inserts" ON clients;

-- Step 6: Create clean, simple policies
-- SELECT policy - all firm members can view clients
CREATE POLICY "firm_members_can_view_clients"
  ON clients FOR SELECT
  TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- INSERT policy - all firm members can create clients
CREATE POLICY "firm_members_can_insert_clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy - all firm members can update clients
CREATE POLICY "firm_members_can_update_clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy - all firm members can delete clients
CREATE POLICY "firm_members_can_delete_clients"
  ON clients FOR DELETE
  TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- Step 7: Verify the fix
DO $$
DECLARE
  policy_count integer;
  column_check text;
BEGIN
  -- Check policies
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'clients'
  AND schemaname = 'public';

  RAISE NOTICE 'Clients table has % policies', policy_count;

  -- Check column
  SELECT column_name INTO column_check
  FROM information_schema.columns
  WHERE table_name = 'clients'
  AND table_schema = 'public'
  AND column_name IN ('firm_id', 'organization_id');

  RAISE NOTICE 'Clients table uses column: %', column_check;

  IF column_check != 'firm_id' THEN
    RAISE EXCEPTION 'Clients table should use firm_id, but uses %', column_check;
  END IF;

  IF policy_count < 4 THEN
    RAISE WARNING 'Clients table should have at least 4 policies (SELECT, INSERT, UPDATE, DELETE)';
  END IF;

  RAISE NOTICE '✅ Client table schema and RLS policies are now properly aligned!';
END $$;
