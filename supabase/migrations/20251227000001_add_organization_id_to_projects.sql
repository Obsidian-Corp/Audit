-- Add organization_id column to projects table if it doesn't exist
-- This is needed for demo seeding

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects'
    AND column_name = 'organization_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.projects
    ADD COLUMN organization_id UUID REFERENCES public.firms(id);

    RAISE NOTICE 'Added organization_id column to projects table';
  ELSE
    RAISE NOTICE 'organization_id column already exists in projects table';
  END IF;
END $$;
