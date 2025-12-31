-- =====================================================================
-- MIGRATION: Add foreign key constraints for audits approval columns
-- Date: 2025-12-29
-- Purpose: Add named foreign keys so Supabase can resolve FK hints in queries
-- =====================================================================

-- Check if approval_requested_by constraint exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'audits_approval_requested_by_fkey'
    AND table_name = 'audits'
    AND table_schema = 'public'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audits'
      AND column_name = 'approval_requested_by'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.audits
        ADD CONSTRAINT audits_approval_requested_by_fkey
        FOREIGN KEY (approval_requested_by)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
      RAISE NOTICE 'Added foreign key: audits_approval_requested_by_fkey';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key audits_approval_requested_by_fkey already exists';
  END IF;
END $$;

-- Check if approved_by constraint exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'audits_approved_by_fkey'
    AND table_name = 'audits'
    AND table_schema = 'public'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audits'
      AND column_name = 'approved_by'
      AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.audits
        ADD CONSTRAINT audits_approved_by_fkey
        FOREIGN KEY (approved_by)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
      RAISE NOTICE 'Added foreign key: audits_approved_by_fkey';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key audits_approved_by_fkey already exists';
  END IF;
END $$;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audits approval foreign key constraints migration completed ***';
END $$;
