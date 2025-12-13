-- RESTORE MISSING INSERT/UPDATE/DELETE POLICIES FOR CLIENTS TABLE
-- The fix_rls_recursion_mega_fix migration only created SELECT policies
-- This migration adds back the write policies using the user_has_role helper function

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Leaders manage clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can update clients" ON public.clients;
DROP POLICY IF EXISTS "Leaders can delete clients" ON public.clients;

-- Create INSERT policy for clients
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

-- Create UPDATE policy for clients
CREATE POLICY "Leaders can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    firm_id = public.user_firm_id(auth.uid())
  )
  WITH CHECK (
    firm_id = public.user_firm_id(auth.uid())
    AND (
      public.user_has_role(auth.uid(), 'firm_administrator'::app_role)
      OR public.user_has_role(auth.uid(), 'partner'::app_role)
      OR public.user_has_role(auth.uid(), 'practice_leader'::app_role)
      OR public.user_has_role(auth.uid(), 'business_development'::app_role)
    )
  );

-- Create DELETE policy for clients
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

COMMENT ON POLICY "Leaders can insert clients" ON public.clients IS 'Allow leaders to create clients in their firm';
COMMENT ON POLICY "Leaders can update clients" ON public.clients IS 'Allow leaders to update clients in their firm';
COMMENT ON POLICY "Leaders can delete clients" ON public.clients IS 'Allow firm_administrator and partner to delete clients';
