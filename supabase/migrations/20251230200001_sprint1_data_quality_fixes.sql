-- =====================================================
-- SPRINT 1: DATA QUALITY FIXES
-- Date: 2025-12-30
-- Tickets: TICKET-DQ-001, DQ-002, DQ-003, DQ-004
-- Target: Data Quality 7/10 → 10/10
-- =====================================================

-- =====================================================
-- TICKET-DQ-001: DEDUPLICATE CONFIRMATIONS TABLE
-- =====================================================
-- Current state: 38 records with massive duplicates
-- Expected state: 10 unique records (one per account_name+confirmation_type+engagement_id)

-- Step 1: Create backup
CREATE TABLE IF NOT EXISTS public.confirmations_backup_20251230 AS
SELECT * FROM public.confirmations;

-- Step 2: Delete duplicates, keeping the oldest record
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY engagement_id, confirmation_type, account_name
      ORDER BY created_at ASC
    ) as rn
  FROM public.confirmations
)
DELETE FROM public.confirmations
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_confirmation_per_engagement'
  ) THEN
    ALTER TABLE public.confirmations
    ADD CONSTRAINT unique_confirmation_per_engagement
    UNIQUE (engagement_id, confirmation_type, account_name);
  END IF;
END $$;

-- Verify: Should now have exactly 10 confirmations
DO $$
DECLARE
  conf_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conf_count FROM public.confirmations;
  RAISE NOTICE 'Confirmations after deduplication: %', conf_count;

  IF conf_count != 10 THEN
    RAISE WARNING 'Expected 10 confirmations, got %', conf_count;
  END IF;
END $$;

-- =====================================================
-- TICKET-DQ-003: CLEAN ORPHANED ENGAGEMENTS
-- =====================================================
-- Issue: AUD-2023-100 "Schema Test Client" has client_id = NULL

-- Option: Delete the orphaned audit and any related records
-- First, delete any related records (workpapers, findings, etc.)
DELETE FROM public.audit_workpapers
WHERE audit_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.audit_findings
WHERE audit_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.confirmations
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.audit_samples
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.materiality_calculations
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.analytical_procedures
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.audit_adjustments
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.subsequent_events
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

DELETE FROM public.client_pbc_items
WHERE engagement_id IN (
  SELECT id FROM public.audits WHERE client_id IS NULL
);

-- Finally delete the orphaned audit
DELETE FROM public.audits WHERE client_id IS NULL;

-- Verify: No orphaned audits
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.audits
  WHERE client_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE WARNING 'Still have % orphaned audits', orphan_count;
  ELSE
    RAISE NOTICE 'All orphaned audits cleaned up';
  END IF;
END $$;

-- =====================================================
-- TICKET-DQ-004: NORMALIZE STATUS VALUES
-- =====================================================
-- Current statuses found in audits table:
-- 'planning', 'fieldwork', 'review', 'reporting', 'completed', 'in_progress'
-- Standard should be: planning → fieldwork → review → reporting → completed

-- Normalize 'in_progress' to 'fieldwork' (they mean the same thing)
UPDATE public.audits
SET status = 'fieldwork'
WHERE status = 'in_progress';

-- Verify: Check remaining statuses
DO $$
DECLARE
  status_rec RECORD;
BEGIN
  RAISE NOTICE 'Audit status distribution after normalization:';
  FOR status_rec IN
    SELECT status, COUNT(*) as cnt FROM public.audits GROUP BY status ORDER BY status
  LOOP
    RAISE NOTICE '  %: %', status_rec.status, status_rec.cnt;
  END LOOP;
END $$;

-- Add CHECK constraint to enforce valid statuses (optional - may break existing data)
-- ALTER TABLE public.audits
-- ADD CONSTRAINT valid_audit_status
-- CHECK (status IN ('planning', 'fieldwork', 'review', 'reporting', 'completed', 'archived'));

-- =====================================================
-- VERIFICATION SUMMARY
-- =====================================================
DO $$
DECLARE
  conf_count INTEGER;
  audit_count INTEGER;
  finding_count INTEGER;
  orphan_audit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conf_count FROM public.confirmations;
  SELECT COUNT(*) INTO audit_count FROM public.audits;
  SELECT COUNT(*) INTO finding_count FROM public.audit_findings;
  SELECT COUNT(*) INTO orphan_audit_count FROM public.audits WHERE client_id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SPRINT 1 DATA QUALITY FIXES COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Confirmations: % (deduplicated)', conf_count;
  RAISE NOTICE 'Audits: % (orphans removed)', audit_count;
  RAISE NOTICE 'Findings: %', finding_count;
  RAISE NOTICE 'Orphaned audits remaining: %', orphan_audit_count;
  RAISE NOTICE '========================================';
END $$;
