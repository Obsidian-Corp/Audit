-- COMPLETE FIX FOR CLIENTS TABLE RLS POLICIES
-- Run this in Supabase SQL Editor to fix all client list page issues

-- First, check if the helper functions exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'user_firm_id'
    ) THEN
        RAISE EXCEPTION 'Helper function user_firm_id does not exist. Please apply earlier migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'user_has_role'
    ) THEN
        RAISE EXCEPTION 'Helper function user_has_role does not exist. Please apply earlier migrations first.';
    END IF;
END $$;

-- Drop ALL existing policies on clients table
DROP POLICY IF EXISTS "Users can view clients in their firm" ON public.clients;
DROP POLICY IF EXISTS "Firm members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their firm's clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders manage clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can update clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can delete clients" ON public.clients;

-- Create SELECT policy (allow all firm members to view clients)
CREATE POLICY "Users can view clients in their firm"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- Create INSERT policy (leaders only)
CREATE POLICY "Leaders can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id = public.user_firm_id(auth.uid())
    AND (
      public.user_has_role(auth.uid(), 'firm_administrator'::app_role)
      OR public.user_has_role(auth.uid(), 'partner'::app_role)
      OR public.user_has_role(auth.uid(), 'practice_leader'::app_role)
      OR public.user_has_role(auth.uid(), 'business_development'::app_role)
    )
  );

-- Create UPDATE policy (leaders only)
CREATE POLICY "Leaders can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()))
  WITH CHECK (
    firm_id = public.user_firm_id(auth.uid())
    AND (
      public.user_has_role(auth.uid(), 'firm_administrator'::app_role)
      OR public.user_has_role(auth.uid(), 'partner'::app_role)
      OR public.user_has_role(auth.uid(), 'practice_leader'::app_role)
      OR public.user_has_role(auth.uid(), 'business_development'::app_role)
    )
  );

-- Create DELETE policy (admins and partners only)
CREATE POLICY "Leaders can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    firm_id = public.user_firm_id(auth.uid())
    AND (
      public.user_has_role(auth.uid(), 'firm_administrator'::app_role)
      OR public.user_has_role(auth.uid(), 'partner'::app_role)
    )
  );

-- Verify RLS is enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON POLICY "Users can view clients in their firm" ON public.clients IS 'Allow all firm members to view clients';
COMMENT ON POLICY "Leaders can insert clients" ON public.clients IS 'Allow leaders to create clients in their firm';
COMMENT ON POLICY "Leaders can update clients" ON public.clients IS 'Allow leaders to update clients in their firm';
COMMENT ON POLICY "Leaders can delete clients" ON public.clients IS 'Allow firm_administrator and partner to delete clients';

-- Show results
SELECT 'SUCCESS: All RLS policies for clients table have been created.' as result;
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;
