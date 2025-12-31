-- =====================================================================
-- MIGRATION: Fix RLS with Simplified Policies
-- Date: 2025-12-29
-- Purpose: Remove duplicate/conflicting policies and use simple firm checks
-- =====================================================================

-- First ensure the helper function exists and works
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

-- =====================================================================
-- FIX AUDITS POLICIES
-- =====================================================================

-- Drop ALL policies on audits to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audits'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.audits', pol.policyname);
    END LOOP;
END $$;

-- Create simple single policy for audits
CREATE POLICY "audits_firm_access"
  ON public.audits
  FOR ALL
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()))
  WITH CHECK (firm_id = public.user_firm_id(auth.uid()));

-- =====================================================================
-- FIX CONFIRMATIONS POLICIES
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'confirmations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.confirmations', pol.policyname);
    END LOOP;
END $$;

-- Confirmations links to audits via engagement_id
CREATE POLICY "confirmations_firm_access"
  ON public.confirmations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = confirmations.engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = engagement_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- =====================================================================
-- FIX AUDIT_FINDINGS POLICIES
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
    col_name TEXT;
BEGIN
    -- Drop all existing policies
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_findings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_findings', pol.policyname);
    END LOOP;

    -- Check what FK column exists
    SELECT column_name INTO col_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_findings'
    AND column_name IN ('audit_id', 'engagement_id')
    LIMIT 1;

    IF col_name = 'audit_id' THEN
        EXECUTE '
            CREATE POLICY "audit_findings_firm_access"
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
    ELSIF col_name = 'engagement_id' THEN
        EXECUTE '
            CREATE POLICY "audit_findings_firm_access"
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
-- FIX ENGAGEMENT_PROCEDURES POLICIES
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
    col_name TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_procedures' AND table_schema = 'public') THEN
        RETURN;
    END IF;

    -- Drop all existing policies
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'engagement_procedures'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.engagement_procedures', pol.policyname);
    END LOOP;

    -- Check what FK column exists
    SELECT column_name INTO col_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'engagement_procedures'
    AND column_name IN ('firm_id', 'engagement_id', 'audit_id')
    LIMIT 1;

    IF col_name = 'firm_id' THEN
        EXECUTE '
            CREATE POLICY "engagement_procedures_firm_access"
              ON public.engagement_procedures
              FOR ALL
              TO authenticated
              USING (firm_id = public.user_firm_id(auth.uid()))
              WITH CHECK (firm_id = public.user_firm_id(auth.uid()))
        ';
    ELSIF col_name IN ('engagement_id', 'audit_id') THEN
        EXECUTE format('
            CREATE POLICY "engagement_procedures_firm_access"
              ON public.engagement_procedures
              FOR ALL
              TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM public.audits a
                  WHERE a.id = engagement_procedures.%I
                  AND a.firm_id = public.user_firm_id(auth.uid())
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM public.audits a
                  WHERE a.id = %I
                  AND a.firm_id = public.user_firm_id(auth.uid())
                )
              )
        ', col_name, col_name);
    END IF;
END $$;

-- =====================================================================
-- FIX AUDIT_PROCEDURES POLICIES
-- =====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'audit_procedures'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_procedures', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "audit_procedures_firm_access"
  ON public.audit_procedures
  FOR ALL
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()))
  WITH CHECK (firm_id = public.user_firm_id(auth.uid()));

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Simplified RLS policies applied successfully';
END $$;
