-- =====================================================================
-- MIGRATION: Add foreign key constraint for audits.created_by to profiles
-- Date: 2025-12-29
-- Purpose: Add named foreign key so Supabase can resolve FK hints in queries
-- =====================================================================

-- Check if created_by constraint exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'audits_created_by_fkey'
    AND table_name = 'audits'
    AND table_schema = 'public'
  ) THEN
    -- First check if there's a column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audits'
      AND column_name = 'created_by'
      AND table_schema = 'public'
    ) THEN
      -- Add the foreign key
      ALTER TABLE public.audits
        ADD CONSTRAINT audits_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
      RAISE NOTICE 'Added foreign key: audits_created_by_fkey';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key audits_created_by_fkey already exists';
  END IF;
END $$;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audits_created_by foreign key constraint migration completed ***';
END $$;
