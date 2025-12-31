-- =====================================================
-- MIGRATION: Comprehensive Data Deduplication
-- Date: 2025-12-30
-- Ticket: TICKET-001, TICKET-003, TICKET-004
-- Purpose: Remove duplicate clients, workpapers, and findings
-- =====================================================

-- =====================================================
-- STEP 1: DEDUPLICATE CLIENTS
-- Keep the first record (oldest created_at) for each client_code + firm_id
-- =====================================================

-- First, update audits to point to the canonical client (the one we'll keep)
WITH canonical_clients AS (
  SELECT DISTINCT ON (client_code, firm_id)
    id as canonical_id,
    client_code,
    firm_id
  FROM clients
  WHERE client_code IS NOT NULL
  ORDER BY client_code, firm_id, created_at ASC
),
duplicate_to_canonical AS (
  SELECT
    c.id as duplicate_id,
    cc.canonical_id
  FROM clients c
  JOIN canonical_clients cc ON c.client_code = cc.client_code AND c.firm_id = cc.firm_id
  WHERE c.id != cc.canonical_id
)
UPDATE audits a
SET client_id = dtc.canonical_id
FROM duplicate_to_canonical dtc
WHERE a.client_id = dtc.duplicate_id;

-- Now delete the duplicate clients (keep oldest per client_code + firm_id)
WITH duplicates AS (
  SELECT id, client_code, firm_id,
    ROW_NUMBER() OVER (PARTITION BY client_code, firm_id ORDER BY created_at ASC) as rn
  FROM clients
  WHERE client_code IS NOT NULL
)
DELETE FROM clients
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Handle the test client with null client_code - set audits to NULL first, then delete
UPDATE audits SET client_id = NULL WHERE client_id IN (
  SELECT id FROM clients WHERE client_code IS NULL AND client_name = 'Schema Test Client'
);
DELETE FROM clients WHERE client_code IS NULL AND client_name = 'Schema Test Client';

-- Add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_code_firm_unique'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_code_firm_unique
      UNIQUE (client_code, firm_id);
  END IF;
END $$;

-- =====================================================
-- STEP 2: DEDUPLICATE WORKPAPERS
-- Keep the first record for each reference_number + audit_id
-- =====================================================

WITH duplicates AS (
  SELECT id, reference_number, audit_id,
    ROW_NUMBER() OVER (PARTITION BY reference_number, audit_id ORDER BY created_at ASC) as rn
  FROM audit_workpapers
  WHERE reference_number IS NOT NULL
)
DELETE FROM audit_workpapers
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workpapers_ref_audit_unique'
  ) THEN
    ALTER TABLE audit_workpapers ADD CONSTRAINT workpapers_ref_audit_unique
      UNIQUE (reference_number, audit_id);
  END IF;
END $$;

-- =====================================================
-- STEP 3: DEDUPLICATE FINDINGS
-- For findings, we have unique finding_numbers but duplicate titles
-- Keep one finding per title + audit_id combination
-- =====================================================

WITH duplicates AS (
  SELECT id, finding_title, audit_id,
    ROW_NUMBER() OVER (PARTITION BY finding_title, audit_id ORDER BY created_at ASC) as rn
  FROM audit_findings
  WHERE finding_title IS NOT NULL
)
DELETE FROM audit_findings
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint on finding_title + audit_id to prevent duplicates
-- (We use title because finding_number is already unique but auto-generated differently each time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'findings_title_audit_unique'
  ) THEN
    ALTER TABLE audit_findings ADD CONSTRAINT findings_title_audit_unique
      UNIQUE (finding_title, audit_id);
  END IF;
END $$;

-- =====================================================
-- STEP 4: VERIFY RESULTS
-- Log the counts after cleanup
-- =====================================================

DO $$
DECLARE
  client_count INTEGER;
  workpaper_count INTEGER;
  finding_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_count FROM clients;
  SELECT COUNT(*) INTO workpaper_count FROM audit_workpapers;
  SELECT COUNT(*) INTO finding_count FROM audit_findings;

  RAISE NOTICE 'Deduplication complete:';
  RAISE NOTICE '  Clients: %', client_count;
  RAISE NOTICE '  Workpapers: %', workpaper_count;
  RAISE NOTICE '  Findings: %', finding_count;
END $$;
