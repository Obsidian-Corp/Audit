-- =====================================================================
-- MIGRATION: Disable RLS on audit_workpapers for debugging
-- Date: 2025-12-30
-- Purpose: Completely disable RLS to verify data access works
-- =====================================================================

-- Disable RLS entirely on audit_workpapers
ALTER TABLE public.audit_workpapers DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audit_workpapers RLS DISABLED ***';
END $$;
