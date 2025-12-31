-- =====================================================================
-- MIGRATION: Fix audit_workpapers RLS policy to avoid recursion
-- Date: 2025-12-29
-- Purpose: Use security definer function to check firm membership
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view workpapers in their firm" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Firm members can view workpapers" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Public full access" ON public.audit_workpapers;

-- Create RLS policies using the existing security definer function
-- user_belongs_to_firm was created in 20251229110001_fix_engagement_documents_rls.sql

-- SELECT policy - users can view workpapers where they belong to the firm
CREATE POLICY "audit_workpapers_select_policy"
    ON public.audit_workpapers
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_firm(firm_id));

-- INSERT policy - users can create workpapers for their firm
CREATE POLICY "audit_workpapers_insert_policy"
    ON public.audit_workpapers
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_belongs_to_firm(firm_id));

-- UPDATE policy - users can update workpapers in their firm
CREATE POLICY "audit_workpapers_update_policy"
    ON public.audit_workpapers
    FOR UPDATE
    TO authenticated
    USING (public.user_belongs_to_firm(firm_id));

-- DELETE policy - users can delete workpapers in their firm
CREATE POLICY "audit_workpapers_delete_policy"
    ON public.audit_workpapers
    FOR DELETE
    TO authenticated
    USING (public.user_belongs_to_firm(firm_id));

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audit_workpapers RLS policies fixed ***';
END $$;
