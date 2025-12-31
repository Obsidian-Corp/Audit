-- Add organization_id column to profiles table if it doesn't exist
-- This is needed for the audit_project_changes trigger
-- Note: organizations might be a view, so no FK constraint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) THEN
    -- Add as a regular UUID column without FK (organizations might be a view)
    ALTER TABLE public.profiles
    ADD COLUMN organization_id UUID;

    -- Copy firm_id to organization_id for existing profiles
    UPDATE public.profiles
    SET organization_id = firm_id
    WHERE firm_id IS NOT NULL AND organization_id IS NULL;

    RAISE NOTICE 'Added organization_id column to profiles table';
  ELSE
    -- Column exists, just update any that have firm_id but not organization_id
    UPDATE public.profiles
    SET organization_id = firm_id
    WHERE firm_id IS NOT NULL AND organization_id IS NULL;

    RAISE NOTICE 'organization_id column already exists in profiles table';
  END IF;
END $$;
