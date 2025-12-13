-- Migration: Confirmation Tracker
-- Purpose: Track audit confirmations (AR, AP, Bank, Legal, etc.)
-- Issue: #9 - Confirmation Tracker
-- Date: 2025-11-30

-- ============================================================================
-- 1. CONFIRMATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Confirmation Details
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN (
    'accounts_receivable',
    'accounts_payable',
    'bank',
    'legal',
    'inventory',
    'investment',
    'loan',
    'insurance',
    'other'
  )),
  entity_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Financial Details
  amount DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  account_number TEXT,

  -- Request & Response Tracking
  request_date DATE NOT NULL,
  response_date DATE,
  follow_up_date DATE,
  response_method TEXT CHECK (response_method IN ('email', 'mail', 'fax', 'portal', 'phone', 'in_person')),

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Request sent, awaiting response
    'received',          -- Response received, no exceptions
    'exception',         -- Response received with exceptions
    'not_responded',     -- No response after follow-up
    'cancelled'          -- Confirmation cancelled/not needed
  )),

  -- Exception Details
  has_exception BOOLEAN DEFAULT false,
  exception_notes TEXT,
  exception_amount DECIMAL(15,2),
  resolution_notes TEXT,

  -- Workpaper Reference
  workpaper_reference TEXT,
  procedure_id UUID REFERENCES public.audit_procedures(id),

  -- Assigned Team Member
  assigned_to UUID REFERENCES profiles(id),
  prepared_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  CONSTRAINT engagement_firm_match CHECK (
    firm_id = (SELECT firm_id FROM audits WHERE id = engagement_id)
  )
);

-- Add helpful comments
COMMENT ON TABLE public.confirmations IS
  'Tracks all audit confirmations (AR, AP, bank, legal, etc.) with exception tracking and follow-up management';
COMMENT ON COLUMN public.confirmations.status IS
  'pending: awaiting response | received: confirmed with no exceptions | exception: confirmed with differences | not_responded: no response after follow-up';
COMMENT ON COLUMN public.confirmations.exception_amount IS
  'Dollar amount of difference between client records and confirmation response';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_confirmations_engagement
  ON public.confirmations(engagement_id, status);
CREATE INDEX IF NOT EXISTS idx_confirmations_firm
  ON public.confirmations(firm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confirmations_type
  ON public.confirmations(confirmation_type, status);
CREATE INDEX IF NOT EXISTS idx_confirmations_assigned
  ON public.confirmations(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_confirmations_dates
  ON public.confirmations(request_date, response_date, follow_up_date);

-- ============================================================================
-- 2. ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- Users can view confirmations for their firm's engagements
CREATE POLICY "Users can view confirmations for their firm"
  ON public.confirmations FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can insert confirmations for their firm's engagements
CREATE POLICY "Users can create confirmations for their firm"
  ON public.confirmations FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update confirmations for their firm
CREATE POLICY "Users can update confirmations for their firm"
  ON public.confirmations FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can delete confirmations for their firm
CREATE POLICY "Users can delete confirmations for their firm"
  ON public.confirmations FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 3. FUNCTIONS: Confirmation Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_confirmation_stats(engagement_id_param UUID)
RETURNS TABLE (
  total_confirmations BIGINT,
  pending_count BIGINT,
  received_count BIGINT,
  exception_count BIGINT,
  not_responded_count BIGINT,
  response_rate NUMERIC,
  overdue_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_confirmations,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'received')::BIGINT as received_count,
    COUNT(*) FILTER (WHERE status = 'exception')::BIGINT as exception_count,
    COUNT(*) FILTER (WHERE status = 'not_responded')::BIGINT as not_responded_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status IN ('received', 'exception'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
      ELSE 0
    END as response_rate,
    COUNT(*) FILTER (WHERE status = 'pending' AND follow_up_date < CURRENT_DATE)::BIGINT as overdue_count
  FROM public.confirmations
  WHERE engagement_id = engagement_id_param;
END;
$$;

COMMENT ON FUNCTION public.get_confirmation_stats IS
  'Returns confirmation statistics for an engagement including response rate and overdue count';

GRANT EXECUTE ON FUNCTION public.get_confirmation_stats TO authenticated;

-- ============================================================================
-- 4. TRIGGERS: Auto-update timestamps and activity logging
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_confirmation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();

  -- Mark as having exception if exception_notes or exception_amount present
  IF NEW.exception_notes IS NOT NULL OR NEW.exception_amount IS NOT NULL THEN
    NEW.has_exception = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_confirmation_timestamp ON public.confirmations;

CREATE TRIGGER trigger_update_confirmation_timestamp
  BEFORE UPDATE ON public.confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_confirmation_timestamp();

-- Log confirmation activity
CREATE OR REPLACE FUNCTION public.log_confirmation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_description TEXT;
  activity_type TEXT;
BEGIN
  -- Determine activity type and description
  IF TG_OP = 'INSERT' THEN
    activity_type := 'confirmation_created';
    activity_description := format('Confirmation request sent to %s (%s)', NEW.entity_name, NEW.confirmation_type);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      activity_type := 'confirmation_status_changed';
      activity_description := format('Confirmation status changed from %s to %s for %s', OLD.status, NEW.status, NEW.entity_name);
    ELSIF OLD.response_date IS NULL AND NEW.response_date IS NOT NULL THEN
      activity_type := 'confirmation_received';
      activity_description := format('Confirmation response received from %s', NEW.entity_name);
    ELSE
      activity_type := 'confirmation_updated';
      activity_description := format('Confirmation updated for %s', NEW.entity_name);
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Insert activity log if engagement_activity table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagement_activity') THEN
    INSERT INTO public.engagement_activity (
      engagement_id,
      firm_id,
      user_id,
      activity_type,
      description,
      metadata
    )
    VALUES (
      NEW.engagement_id,
      NEW.firm_id,
      auth.uid(),
      activity_type,
      activity_description,
      jsonb_build_object(
        'confirmation_id', NEW.id,
        'entity_name', NEW.entity_name,
        'confirmation_type', NEW.confirmation_type,
        'status', NEW.status,
        'has_exception', NEW.has_exception
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_confirmation_activity ON public.confirmations;

CREATE TRIGGER trigger_log_confirmation_activity
  AFTER INSERT OR UPDATE ON public.confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_confirmation_activity();

COMMENT ON TRIGGER trigger_log_confirmation_activity ON public.confirmations IS
  'Logs confirmation activities to engagement activity feed';

-- ============================================================================
-- 5. SAMPLE DATA (Optional - for development only)
-- ============================================================================
-- Uncomment to add sample confirmations for testing
/*
DO $$
DECLARE
  sample_engagement_id UUID;
  sample_firm_id UUID;
BEGIN
  -- Get a sample engagement
  SELECT id, firm_id INTO sample_engagement_id, sample_firm_id
  FROM audits
  LIMIT 1;

  IF sample_engagement_id IS NOT NULL THEN
    INSERT INTO confirmations (
      engagement_id,
      firm_id,
      confirmation_type,
      entity_name,
      contact_email,
      amount,
      request_date,
      status
    )
    VALUES
      (sample_engagement_id, sample_firm_id, 'accounts_receivable', 'ABC Corporation', 'ar@abc.com', 125000.00, CURRENT_DATE - INTERVAL '14 days', 'received'),
      (sample_engagement_id, sample_firm_id, 'bank', 'First National Bank', 'confirmations@fnb.com', 500000.00, CURRENT_DATE - INTERVAL '10 days', 'pending'),
      (sample_engagement_id, sample_firm_id, 'legal', 'Smith & Associates Law Firm', 'confirmations@smithlaw.com', NULL, CURRENT_DATE - INTERVAL '7 days', 'pending');
  END IF;
END $$;
*/
