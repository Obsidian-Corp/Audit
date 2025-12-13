-- Migration: Enhance engagements (audits table) for comprehensive detail page
-- Issue #1: Missing Engagement Detail Page
-- Date: 2025-11-29

-- Add engagement phase and progress tracking fields to audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS engagement_phase TEXT DEFAULT 'planning'
  CHECK (engagement_phase IN ('planning', 'fieldwork', 'review', 'reporting', 'complete'));

ALTER TABLE audits ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0
  CHECK (progress_percentage BETWEEN 0 AND 100);

ALTER TABLE audits ADD COLUMN IF NOT EXISTS budget_hours DECIMAL(10,2);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10,2) DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audits_firm_status ON audits(firm_id, workflow_status);
CREATE INDEX IF NOT EXISTS idx_audits_firm_phase ON audits(firm_id, engagement_phase);
CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);

-- Create engagement_activity table for activity feed
CREATE TABLE IF NOT EXISTS engagement_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
  firm_id UUID REFERENCES firms(id) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL, -- 'workpaper_added', 'evidence_uploaded', 'time_logged', 'status_changed', 'procedure_completed', 'finding_added'
  description TEXT NOT NULL,
  metadata JSONB, -- {workpaper_id, file_id, hours, old_status, new_status, etc.}
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_activity_engagement ON engagement_activity(engagement_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_activity_firm ON engagement_activity(firm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_activity_user ON engagement_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_activity_type ON engagement_activity(activity_type);

-- Enable RLS on engagement_activity
ALTER TABLE engagement_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view engagement activity for their firm's engagements
CREATE POLICY "Users can view engagement activity for their firm's engagements"
  ON engagement_activity FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert engagement activity for their firm's engagements
CREATE POLICY "Users can insert engagement activity for their firm's engagements"
  ON engagement_activity FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function: Calculate engagement progress based on procedure completion
CREATE OR REPLACE FUNCTION calculate_engagement_progress(engagement_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_procedures INTEGER;
  completed_procedures INTEGER;
  progress INTEGER;
BEGIN
  -- Count total procedures for this engagement
  SELECT COUNT(*) INTO total_procedures
  FROM audit_procedures
  WHERE audit_id = engagement_id_param;

  -- Count completed procedures
  SELECT COUNT(*) INTO completed_procedures
  FROM audit_procedures
  WHERE audit_id = engagement_id_param
    AND status = 'completed';

  -- Calculate progress percentage
  IF total_procedures = 0 THEN
    RETURN 0;
  ELSE
    progress := ROUND((completed_procedures::DECIMAL / total_procedures::DECIMAL) * 100);
    RETURN progress;
  END IF;
END;
$$;

-- Function: Log engagement activity (helper function for triggers and manual calls)
CREATE OR REPLACE FUNCTION log_engagement_activity(
  engagement_id_param UUID,
  activity_type_param TEXT,
  description_param TEXT,
  metadata_param JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  firm_id_val UUID;
BEGIN
  -- Get firm_id from engagement
  SELECT firm_id INTO firm_id_val
  FROM audits
  WHERE id = engagement_id_param;

  -- Insert activity
  INSERT INTO engagement_activity (
    engagement_id,
    firm_id,
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    engagement_id_param,
    firm_id_val,
    auth.uid(),
    activity_type_param,
    description_param,
    metadata_param
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$;

-- Trigger: Auto-log when engagement status changes
CREATE OR REPLACE FUNCTION trigger_log_engagement_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.workflow_status IS DISTINCT FROM NEW.workflow_status) THEN
    PERFORM log_engagement_activity(
      NEW.id,
      'status_changed',
      'Engagement status changed from ' || COALESCE(OLD.workflow_status, 'null') || ' to ' || NEW.workflow_status,
      jsonb_build_object(
        'old_status', OLD.workflow_status,
        'new_status', NEW.workflow_status
      )
    );
  END IF;

  IF (OLD.engagement_phase IS DISTINCT FROM NEW.engagement_phase) THEN
    PERFORM log_engagement_activity(
      NEW.id,
      'phase_changed',
      'Engagement phase changed from ' || COALESCE(OLD.engagement_phase, 'null') || ' to ' || NEW.engagement_phase,
      jsonb_build_object(
        'old_phase', OLD.engagement_phase,
        'new_phase', NEW.engagement_phase
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_status_change_log
  AFTER UPDATE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_engagement_status_change();

-- Comments for documentation
COMMENT ON TABLE engagement_activity IS 'Activity feed for engagement detail page - tracks all major actions within an engagement';
COMMENT ON COLUMN audits.engagement_phase IS 'Current phase of the engagement (planning, fieldwork, review, reporting, complete)';
COMMENT ON COLUMN audits.progress_percentage IS 'Calculated progress percentage (0-100) based on procedure completion';
COMMENT ON COLUMN audits.budget_hours IS 'Budgeted hours for the engagement';
COMMENT ON COLUMN audits.actual_hours IS 'Actual hours logged for the engagement';
COMMENT ON FUNCTION calculate_engagement_progress IS 'Calculates engagement progress based on completed procedures';
COMMENT ON FUNCTION log_engagement_activity IS 'Helper function to log engagement activity with proper firm and user context';
