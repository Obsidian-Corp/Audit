-- =====================================================================
-- MIGRATION: Fix engagement_documents RLS policy to avoid recursion
-- Date: 2025-12-29
-- Purpose: Use security definer function to check firm membership
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Firm members see documents" ON engagement_documents;
DROP POLICY IF EXISTS "Team members manage documents" ON engagement_documents;

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.user_belongs_to_firm(check_firm_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND firm_id = check_firm_id
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_belongs_to_firm(uuid) TO authenticated;

-- Create new RLS policies using the security definer function
CREATE POLICY "engagement_documents_select_policy"
    ON engagement_documents
    FOR SELECT
    TO authenticated
    USING (public.user_belongs_to_firm(firm_id));

CREATE POLICY "engagement_documents_insert_policy"
    ON engagement_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_belongs_to_firm(firm_id));

CREATE POLICY "engagement_documents_update_policy"
    ON engagement_documents
    FOR UPDATE
    TO authenticated
    USING (public.user_belongs_to_firm(firm_id));

CREATE POLICY "engagement_documents_delete_policy"
    ON engagement_documents
    FOR DELETE
    TO authenticated
    USING (public.user_belongs_to_firm(firm_id));

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** engagement_documents RLS policies fixed ***';
END $$;
