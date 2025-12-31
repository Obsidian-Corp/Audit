-- =====================================================================
-- MIGRATION: Fix audit_workpapers RLS - simple firm_id check
-- Date: 2025-12-29
-- Purpose: Use simple direct firm_id comparison instead of function
-- =====================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "audit_workpapers_select_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_insert_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_update_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "audit_workpapers_delete_policy" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Users can view workpapers in their firm" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Firm members can view workpapers" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Public full access" ON public.audit_workpapers;

-- Ensure RLS is enabled
ALTER TABLE public.audit_workpapers ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policy using security definer function
-- This uses user_firm_id which was created in fix_rls_recursion_mega_fix.sql
CREATE POLICY "workpapers_firm_access"
    ON public.audit_workpapers
    FOR ALL
    TO authenticated
    USING (firm_id = public.user_firm_id(auth.uid()))
    WITH CHECK (firm_id = public.user_firm_id(auth.uid()));

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audit_workpapers RLS simplified ***';
END $$;
