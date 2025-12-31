-- =====================================================================
-- MIGRATION: Force add foreign key constraints for audits approval columns
-- Date: 2025-12-29
-- Purpose: Add FK constraints that were missing
-- =====================================================================

-- Drop if exists (to handle potential partial state) then recreate
DO $$
BEGIN
  -- Drop existing constraint if any
  ALTER TABLE public.audits DROP CONSTRAINT IF EXISTS audits_approval_requested_by_fkey;

  -- Add the foreign key
  ALTER TABLE public.audits
    ADD CONSTRAINT audits_approval_requested_by_fkey
    FOREIGN KEY (approval_requested_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
  RAISE NOTICE 'Added foreign key: audits_approval_requested_by_fkey';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding audits_approval_requested_by_fkey: %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Drop existing constraint if any
  ALTER TABLE public.audits DROP CONSTRAINT IF EXISTS audits_approved_by_fkey;

  -- Add the foreign key
  ALTER TABLE public.audits
    ADD CONSTRAINT audits_approved_by_fkey
    FOREIGN KEY (approved_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
  RAISE NOTICE 'Added foreign key: audits_approved_by_fkey';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding audits_approved_by_fkey: %', SQLERRM;
END $$;

-- =====================================================================
-- DONE
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '*** audits approval foreign key constraints migration completed ***';
END $$;
