-- Surgical fixes for platform admin dashboard
-- Only adds what's truly missing

-- Fix 1: Add organizations view (maps to firms table)
-- Edge functions query 'organizations' but table is named 'firms'
CREATE OR REPLACE VIEW public.organizations AS
SELECT
  id,
  name,
  slug,
  created_at,
  updated_at
FROM public.firms;

COMMENT ON VIEW public.organizations IS 'Compatibility view mapping to firms table';

-- Fix 2: Add computed full_name column to profiles
-- Edge functions expect full_name but table has first_name + last_name
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT
GENERATED ALWAYS AS (
  CASE
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL
      THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL
      THEN first_name
    WHEN last_name IS NOT NULL
      THEN last_name
    ELSE email
  END
) STORED;

COMMENT ON COLUMN public.profiles.full_name IS 'Computed from first_name + last_name for edge function compatibility';
