-- =====================================================================
-- MIGRATION: Add foreign key constraints for audits to profiles
-- Date: 2025-12-29
-- Purpose: Add named foreign keys so Supabase can resolve FK hints in queries
-- =====================================================================

-- Check if lead_auditor_id constraint exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'audits_lead_auditor_id_fkey'
    AND table_name = 'audits'
    AND table_schema = 'public'
  ) THEN
    -- First check if there's a column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audits'
      AND column_name = 'lead_auditor_id'
      AND table_schema = 'public'
    ) THEN
      -- Add the foreign key
      ALTER TABLE public.audits
        ADD CONSTRAINT audits_lead_auditor_id_fkey
        FOREIGN KEY (lead_auditor_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
      RAISE NOTICE 'Added foreign key: audits_lead_auditor_id_fkey';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key audits_lead_auditor_id_fkey already exists';
  END IF;
END $$;

-- Check if manager_id constraint exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'audits_manager_id_fkey'
    AND table_name = 'audits'
    AND table_schema = 'public'
  ) THEN
    -- First check if there's a column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audits'
      AND column_name = 'manager_id'
      AND table_schema = 'public'
    ) THEN
      -- Add the foreign key
      ALTER TABLE public.audits
        ADD CONSTRAINT audits_manager_id_fkey
        FOREIGN KEY (manager_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
      RAISE NOTICE 'Added foreign key: audits_manager_id_fkey';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key audits_manager_id_fkey already exists';
  END IF;
END $$;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audits foreign key constraints migration completed ***';
END $$;
