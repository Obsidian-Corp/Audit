-- Quick fix for clients INSERT policy to allow testing
-- This ensures any authenticated user in the same firm can create clients

-- First ensure the helper function exists
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

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Leaders can insert clients" ON clients;
DROP POLICY IF EXISTS "firm_members_insert_clients" ON clients;

-- Create the INSERT policy that allows firm members to create clients
CREATE POLICY "firm_members_insert_clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- Verify the policy was created
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT count(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'clients'
  AND policyname = 'firm_members_insert_clients'
  AND schemaname = 'public';

  IF policy_count = 1 THEN
    RAISE NOTICE 'Client INSERT policy successfully created!';
  ELSE
    RAISE WARNING 'Failed to create client INSERT policy';
  END IF;
END $$;
