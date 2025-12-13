-- Fix: Add missing follow_up_date column to confirmations table
-- This column was in the migration but the table already existed from a previous session

-- Add follow_up_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'confirmations' 
    AND column_name = 'follow_up_date'
  ) THEN
    ALTER TABLE public.confirmations 
    ADD COLUMN follow_up_date DATE;
    
    COMMENT ON COLUMN public.confirmations.follow_up_date IS 
      'Target date for follow-up if no response received';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'confirmations'
  AND column_name = 'follow_up_date';
