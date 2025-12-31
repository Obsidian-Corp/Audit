-- Add organization_id column to audit_logs table if it doesn't exist
-- This is needed for the log_audit_event function called by triggers

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.audit_logs
    ADD COLUMN organization_id UUID;

    RAISE NOTICE 'Added organization_id column to audit_logs table';
  ELSE
    RAISE NOTICE 'organization_id column already exists in audit_logs table';
  END IF;
END $$;
