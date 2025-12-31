-- =====================================================================
-- MIGRATION: Temporarily open audit_workpapers access for debugging
-- Date: 2025-12-29
-- Purpose: Allow all authenticated users access to debug RLS issues
-- =====================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "workpapers_firm_access" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_select_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_insert_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_update_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_delete_policy" ON public.audit_workpapers;

-- Create open access policy for debugging
CREATE POLICY "workpapers_authenticated_access"
    ON public.audit_workpapers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audit_workpapers open access for debugging ***';
END $$;
