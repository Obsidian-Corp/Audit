-- =====================================================================
-- MIGRATION: Fix RLS Infinite Recursion Comprehensively
-- Date: 2025-12-29
-- Purpose: Fix RLS policies that cause infinite recursion by:
--          1. Using SECURITY DEFINER helper functions
--          2. Ensuring user_roles can be queried without recursion
--          3. Fixing confirmations and engagement_procedures policies
-- =====================================================================

-- =====================================================================
-- STEP 0: Drop existing functions with potentially incompatible signatures
-- =====================================================================

DROP FUNCTION IF EXISTS public.is_org_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_firm_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.user_is_firm_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_firms(UUID) CASCADE;

-- =====================================================================
-- STEP 1: Create SECURITY DEFINER helper functions
-- These functions bypass RLS to prevent recursion
-- =====================================================================

-- Helper function to get user's firm_id from profiles
CREATE FUNCTION public.user_firm_id(check_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM public.profiles WHERE id = check_user_id LIMIT 1;
$$;

-- Helper function to check if user has a specific role (queries user_roles with SECURITY DEFINER)
CREATE FUNCTION public.user_has_role(check_user_id UUID, check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = check_role
  );
$$;

-- Helper function to check if user is a member of a firm
CREATE FUNCTION public.user_is_firm_member(check_user_id UUID, check_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND firm_id = check_firm_id
  );
$$;

-- Helper function to get all firm IDs a user belongs to
CREATE FUNCTION public.get_user_firms(check_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM public.profiles WHERE id = check_user_id;
$$;

-- Helper function for is_org_member (for backwards compatibility with old policies)
CREATE FUNCTION public.is_org_member(check_user_id UUID, check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Check if user's firm_id matches the org_id
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND firm_id = check_org_id
  );
$$;

-- =====================================================================
-- STEP 2: Fix user_roles RLS policies
-- The key issue: user_roles policies must NOT query user_roles
-- =====================================================================

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_firm_roles" ON public.user_roles;
DROP POLICY IF EXISTS "firm_admins_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Firm members can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their firm" ON public.user_roles;

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can see their OWN roles (no recursion since we use auth.uid() directly)
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view all roles in their firm (using SECURITY DEFINER function)
CREATE POLICY "user_roles_select_firm"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- Firm admins can manage roles (insert/update/delete) for their firm
-- This uses the user_has_role SECURITY DEFINER function to avoid recursion
CREATE POLICY "user_roles_admin_manage"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    firm_id = public.user_firm_id(auth.uid())
    AND public.user_has_role(auth.uid(), 'firm_administrator')
  )
  WITH CHECK (
    firm_id = public.user_firm_id(auth.uid())
    AND public.user_has_role(auth.uid(), 'firm_administrator')
  );

-- =====================================================================
-- STEP 3: Fix confirmations RLS policies
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view confirmations in their firm's engagements" ON public.confirmations;
DROP POLICY IF EXISTS "Users can create confirmations in their firm's engagements" ON public.confirmations;
DROP POLICY IF EXISTS "Users can update confirmations in their firm's engagements" ON public.confirmations;
DROP POLICY IF EXISTS "Users can delete confirmations in their firm's engagements" ON public.confirmations;
DROP POLICY IF EXISTS "Users can view confirmations for their firm" ON public.confirmations;
DROP POLICY IF EXISTS "Users can create confirmations for their firm" ON public.confirmations;
DROP POLICY IF EXISTS "Users can update confirmations for their firm" ON public.confirmations;
DROP POLICY IF EXISTS "Users can delete confirmations for their firm" ON public.confirmations;
DROP POLICY IF EXISTS "Users can manage confirmations" ON public.confirmations;

-- Enable RLS
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- Confirmations are accessed via engagement_id which links to audits table
-- Use a simple join with audits to check firm_id
CREATE POLICY "confirmations_select_firm"
  ON public.confirmations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = confirmations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "confirmations_insert_firm"
  ON public.confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "confirmations_update_firm"
  ON public.confirmations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = confirmations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

CREATE POLICY "confirmations_delete_firm"
  ON public.confirmations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = confirmations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- =====================================================================
-- STEP 4: Fix engagement_procedures RLS policies (if table exists)
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_procedures' AND table_schema = 'public') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view engagement procedures in their firm" ON public.engagement_procedures;
    DROP POLICY IF EXISTS "Users can manage engagement procedures" ON public.engagement_procedures;
    DROP POLICY IF EXISTS "engagement_procedures_select" ON public.engagement_procedures;

    -- Enable RLS
    ALTER TABLE public.engagement_procedures ENABLE ROW LEVEL SECURITY;

    -- Check if engagement_procedures has firm_id or engagement_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'engagement_procedures'
      AND column_name = 'firm_id'
      AND table_schema = 'public'
    ) THEN
      -- If it has firm_id, use direct check
      EXECUTE '
        CREATE POLICY "engagement_procedures_select_firm"
          ON public.engagement_procedures
          FOR SELECT
          TO authenticated
          USING (firm_id = public.user_firm_id(auth.uid()))
      ';

      EXECUTE '
        CREATE POLICY "engagement_procedures_all_firm"
          ON public.engagement_procedures
          FOR ALL
          TO authenticated
          USING (firm_id = public.user_firm_id(auth.uid()))
          WITH CHECK (firm_id = public.user_firm_id(auth.uid()))
      ';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'engagement_procedures'
      AND column_name = 'engagement_id'
      AND table_schema = 'public'
    ) THEN
      -- If it has engagement_id, join with audits
      EXECUTE '
        CREATE POLICY "engagement_procedures_select_firm"
          ON public.engagement_procedures
          FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.audits a
              WHERE a.id = engagement_procedures.engagement_id
              AND a.firm_id = public.user_firm_id(auth.uid())
            )
          )
      ';

      EXECUTE '
        CREATE POLICY "engagement_procedures_insert_firm"
          ON public.engagement_procedures
          FOR INSERT
          TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.audits a
              WHERE a.id = engagement_id
              AND a.firm_id = public.user_firm_id(auth.uid())
            )
          )
      ';

      EXECUTE '
        CREATE POLICY "engagement_procedures_update_firm"
          ON public.engagement_procedures
          FOR UPDATE
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.audits a
              WHERE a.id = engagement_procedures.engagement_id
              AND a.firm_id = public.user_firm_id(auth.uid())
            )
          )
      ';
    END IF;
  END IF;
END $$;

-- =====================================================================
-- STEP 5: Fix audit_procedures RLS policies
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view procedures in their firm" ON public.audit_procedures;
DROP POLICY IF EXISTS "procedures_update_team" ON public.audit_procedures;
DROP POLICY IF EXISTS "Audit team can view procedures" ON public.audit_procedures;

-- audit_procedures has firm_id directly - simple policy
CREATE POLICY "audit_procedures_select_firm"
  ON public.audit_procedures
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

CREATE POLICY "audit_procedures_all_firm"
  ON public.audit_procedures
  FOR ALL
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()))
  WITH CHECK (firm_id = public.user_firm_id(auth.uid()));

-- =====================================================================
-- STEP 6: Fix audit_findings RLS policies
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view findings in their firm" ON public.audit_findings;
DROP POLICY IF EXISTS "findings_select_firm" ON public.audit_findings;
DROP POLICY IF EXISTS "findings_insert_team" ON public.audit_findings;
DROP POLICY IF EXISTS "findings_update_team" ON public.audit_findings;

-- Enable RLS
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

-- Check if audit_findings has audit_id or engagement_id
DO $$
DECLARE
  has_audit_id BOOLEAN;
  has_engagement_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_findings'
    AND column_name = 'audit_id'
    AND table_schema = 'public'
  ) INTO has_audit_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_findings'
    AND column_name = 'engagement_id'
    AND table_schema = 'public'
  ) INTO has_engagement_id;

  IF has_audit_id THEN
    EXECUTE '
      CREATE POLICY "audit_findings_select_firm"
        ON public.audit_findings
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = audit_findings.audit_id
            AND a.firm_id = public.user_firm_id(auth.uid())
          )
        )
    ';

    EXECUTE '
      CREATE POLICY "audit_findings_all_firm"
        ON public.audit_findings
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = audit_findings.audit_id
            AND a.firm_id = public.user_firm_id(auth.uid())
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = audit_id
            AND a.firm_id = public.user_firm_id(auth.uid())
          )
        )
    ';
  ELSIF has_engagement_id THEN
    EXECUTE '
      CREATE POLICY "audit_findings_select_firm"
        ON public.audit_findings
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = audit_findings.engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
          )
        )
    ';

    EXECUTE '
      CREATE POLICY "audit_findings_all_firm"
        ON public.audit_findings
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = audit_findings.engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.audits a
            WHERE a.id = engagement_id
            AND a.firm_id = public.user_firm_id(auth.uid())
          )
        )
    ';
  END IF;
END $$;

-- =====================================================================
-- STEP 7: Ensure audits table policies are correct
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view audits in their firm" ON public.audits;
DROP POLICY IF EXISTS "Org members can view audits" ON public.audits;
DROP POLICY IF EXISTS "Audit managers can create audits" ON public.audits;
DROP POLICY IF EXISTS "Audit leads and admins can update audits" ON public.audits;

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Simple firm-based policy for audits
CREATE POLICY "audits_select_firm"
  ON public.audits
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

CREATE POLICY "audits_all_firm"
  ON public.audits
  FOR ALL
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()))
  WITH CHECK (firm_id = public.user_firm_id(auth.uid()));

-- =====================================================================
-- STEP 8: Grant execute permissions on helper functions
-- =====================================================================

GRANT EXECUTE ON FUNCTION public.user_firm_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_firm_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_firms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS recursion fix migration completed successfully';
  RAISE NOTICE '   - Created SECURITY DEFINER helper functions';
  RAISE NOTICE '   - Fixed user_roles policies';
  RAISE NOTICE '   - Fixed confirmations policies';
  RAISE NOTICE '   - Fixed engagement_procedures policies';
  RAISE NOTICE '   - Fixed audit_findings policies';
  RAISE NOTICE '   - Fixed audits policies';
END $$;
