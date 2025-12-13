-- Migration: Enforce Risk-First Workflow
-- Purpose: Ensure AU-C 315 compliance by requiring risk assessment before program building
-- Issue: #2 - Risk-First Workflow Enforcement
-- Date: 2025-11-30

-- ============================================================================
-- 1. RISK ASSESSMENT REQUIREMENTS TABLE
-- ============================================================================
-- Tracks whether risk assessment is complete for each engagement
CREATE TABLE IF NOT EXISTS public.risk_assessment_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL UNIQUE REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Completion Tracking
  is_complete BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),

  -- Override Capability (Partner-only)
  override_allowed BOOLEAN DEFAULT false NOT NULL,
  override_justification TEXT,
  override_by UUID REFERENCES profiles(id),
  override_at TIMESTAMPTZ,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add helpful comments
COMMENT ON TABLE public.risk_assessment_requirements IS
  'Tracks risk assessment completion status to enforce AU-C 315 requirement that risk must be assessed before selecting procedures';
COMMENT ON COLUMN public.risk_assessment_requirements.override_allowed IS
  'Allows partner to override requirement with justification (logged for quality control review)';
COMMENT ON COLUMN public.risk_assessment_requirements.is_complete IS
  'True when engagement has at least one approved risk assessment';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_requirements_engagement
  ON public.risk_assessment_requirements(engagement_id);
CREATE INDEX IF NOT EXISTS idx_risk_requirements_firm
  ON public.risk_assessment_requirements(firm_id, is_complete);

-- ============================================================================
-- 2. FUNCTION: Check if Risk Assessment is Complete
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_risk_assessment_complete(engagement_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requirement_status BOOLEAN;
  has_override BOOLEAN;
BEGIN
  -- Check if requirement exists and is complete OR has override
  SELECT
    COALESCE(is_complete, false) OR COALESCE(override_allowed, false)
  INTO requirement_status
  FROM public.risk_assessment_requirements
  WHERE engagement_id = engagement_id_param;

  -- If no record exists, return false
  RETURN COALESCE(requirement_status, false);
END;
$$;

COMMENT ON FUNCTION public.check_risk_assessment_complete IS
  'Returns true if engagement has completed risk assessment OR has partner override approval';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_risk_assessment_complete TO authenticated;

-- ============================================================================
-- 3. FUNCTION: Mark Risk Assessment Complete
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_risk_assessment_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update risk requirement when risk assessment is approved
  INSERT INTO public.risk_assessment_requirements (
    engagement_id,
    firm_id,
    is_complete,
    completed_at,
    completed_by
  )
  VALUES (
    NEW.engagement_id,
    NEW.firm_id,
    (NEW.review_status = 'approved'),
    CASE WHEN NEW.review_status = 'approved' THEN now() ELSE NULL END,
    CASE WHEN NEW.review_status = 'approved' THEN auth.uid() ELSE NULL END
  )
  ON CONFLICT (engagement_id)
  DO UPDATE SET
    is_complete = (NEW.review_status = 'approved'),
    completed_at = CASE WHEN NEW.review_status = 'approved' THEN now() ELSE risk_assessment_requirements.completed_at END,
    completed_by = CASE WHEN NEW.review_status = 'approved' THEN auth.uid() ELSE risk_assessment_requirements.completed_by END,
    updated_at = now();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.mark_risk_assessment_complete IS
  'Automatically marks risk requirement as complete when engagement_risk_assessments.review_status = approved';

-- ============================================================================
-- 4. TRIGGER: Auto-mark complete when risk assessment approved
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_risk_assessment_complete ON public.engagement_risk_assessments;

CREATE TRIGGER trigger_risk_assessment_complete
  AFTER INSERT OR UPDATE OF review_status ON public.engagement_risk_assessments
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION public.mark_risk_assessment_complete();

COMMENT ON TRIGGER trigger_risk_assessment_complete ON public.engagement_risk_assessments IS
  'Automatically updates risk_assessment_requirements when risk assessment is approved';

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE public.risk_assessment_requirements ENABLE ROW LEVEL SECURITY;

-- Users can view requirements for their firm's engagements
CREATE POLICY "Users can view risk requirements for their firm"
  ON public.risk_assessment_requirements FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only authenticated users can insert (via trigger primarily)
CREATE POLICY "Authenticated users can create risk requirements"
  ON public.risk_assessment_requirements FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Partners and managers can update (for overrides)
CREATE POLICY "Partners can override risk requirements"
  ON public.risk_assessment_requirements FOR UPDATE
  USING (
    firm_id IN (
      SELECT p.firm_id
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role IN ('firm_administrator', 'partner', 'engagement_manager')
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT p.firm_id
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role IN ('firm_administrator', 'partner', 'engagement_manager')
    )
  );

-- ============================================================================
-- 6. SEED EXISTING ENGAGEMENTS
-- ============================================================================
-- Mark risk requirements as complete for engagements that already have approved assessments
INSERT INTO public.risk_assessment_requirements (
  engagement_id,
  firm_id,
  is_complete,
  completed_at,
  completed_by
)
SELECT DISTINCT
  era.engagement_id,
  era.firm_id,
  true,
  era.created_at,
  era.assessed_by
FROM public.engagement_risk_assessments era
WHERE era.is_current = true
  AND era.review_status = 'approved'
  AND NOT EXISTS (
    SELECT 1
    FROM public.risk_assessment_requirements rar
    WHERE rar.engagement_id = era.engagement_id
  )
ON CONFLICT (engagement_id) DO NOTHING;

-- ============================================================================
-- 7. ACTIVITY LOGGING
-- ============================================================================
-- Log activity when risk requirement is overridden
CREATE OR REPLACE FUNCTION public.log_risk_requirement_override()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when override_allowed changes from false to true
  IF (OLD.override_allowed = false AND NEW.override_allowed = true) THEN
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
        'risk_requirement_override',
        'Partner override: Risk assessment requirement bypassed',
        jsonb_build_object(
          'justification', NEW.override_justification,
          'override_by', NEW.override_by,
          'override_at', NEW.override_at
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_risk_override ON public.risk_assessment_requirements;

CREATE TRIGGER trigger_log_risk_override
  AFTER UPDATE OF override_allowed ON public.risk_assessment_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.log_risk_requirement_override();

COMMENT ON TRIGGER trigger_log_risk_override ON public.risk_assessment_requirements IS
  'Logs risk requirement overrides to engagement activity feed for quality control review';


-- ================================================================
-- MIGRATION #2: CONFIRMATION STATS RPC FUNCTION
-- ================================================================
-- The confirmations table already exists, so we only add the RPC function

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
    COUNT(*)::BIGINT AS total_confirmations,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_count,
    COUNT(*) FILTER (WHERE status = 'received')::BIGINT AS received_count,
    COUNT(*) FILTER (WHERE status = 'exception')::BIGINT AS exception_count,
    COUNT(*) FILTER (WHERE status = 'not_responded')::BIGINT AS not_responded_count,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('received', 'exception'))::NUMERIC / COUNT(*)::NUMERIC) * 100,
          1
        )
      ELSE 0
    END AS response_rate,
    COUNT(*) FILTER (
      WHERE status = 'pending'
        AND follow_up_date IS NOT NULL
        AND follow_up_date < CURRENT_DATE
    )::BIGINT AS overdue_count
  FROM public.confirmations
  WHERE engagement_id = engagement_id_param;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_confirmation_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmation_stats(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.get_confirmation_stats(UUID) IS
  'Calculate confirmation statistics for engagement dashboard including response rate and overdue count';
