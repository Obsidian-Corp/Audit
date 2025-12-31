-- =====================================================================
-- MIGRATION: Create workpaper_signoffs table
-- Ticket: DB-001
-- Purpose: Track electronic sign-offs on workpapers with multi-level
--          approval workflow (preparer → reviewer → manager → partner)
-- =====================================================================

-- Create the workpaper_signoffs table
CREATE TABLE IF NOT EXISTS public.workpaper_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  workpaper_id UUID NOT NULL REFERENCES public.audit_workpapers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sign-off details
  signoff_type VARCHAR(50) NOT NULL CHECK (signoff_type IN ('preparer', 'reviewer', 'manager', 'partner')),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments TEXT,

  -- Security/audit trail
  signature_hash VARCHAR(256),
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one signoff per type per workpaper
  CONSTRAINT unique_signoff_type_per_workpaper UNIQUE (workpaper_id, signoff_type)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workpaper_signoffs_workpaper
  ON public.workpaper_signoffs(workpaper_id);

CREATE INDEX IF NOT EXISTS idx_workpaper_signoffs_user
  ON public.workpaper_signoffs(user_id);

CREATE INDEX IF NOT EXISTS idx_workpaper_signoffs_type
  ON public.workpaper_signoffs(signoff_type);

CREATE INDEX IF NOT EXISTS idx_workpaper_signoffs_signed_at
  ON public.workpaper_signoffs(signed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.workpaper_signoffs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view signoffs for workpapers in their firm's engagements
CREATE POLICY "Users can view signoffs in their firm"
  ON public.workpaper_signoffs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.audit_workpapers wp
      JOIN public.audits a ON a.id = wp.audit_id
      WHERE wp.id = workpaper_signoffs.workpaper_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- RLS Policy: Users can create signoffs for workpapers in their firm's engagements
CREATE POLICY "Users can create signoffs in their firm"
  ON public.workpaper_signoffs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.audit_workpapers wp
      JOIN public.audits a ON a.id = wp.audit_id
      WHERE wp.id = workpaper_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- RLS Policy: Only admins can delete signoffs (for corrections)
CREATE POLICY "Admins can delete signoffs"
  ON public.workpaper_signoffs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('firm_administrator', 'partner')
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.workpaper_signoffs IS 'Tracks electronic sign-offs on audit workpapers per AU-C 230. Supports preparer, reviewer, manager, and partner levels.';
COMMENT ON COLUMN public.workpaper_signoffs.signoff_type IS 'Level of sign-off: preparer (first), reviewer (second), manager (third), partner (final)';
COMMENT ON COLUMN public.workpaper_signoffs.signature_hash IS 'SHA-256 hash of workpaper content at time of signing for integrity verification';
COMMENT ON COLUMN public.workpaper_signoffs.ip_address IS 'IP address of signer for audit trail';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ DB-001: workpaper_signoffs table created successfully';
END $$;
