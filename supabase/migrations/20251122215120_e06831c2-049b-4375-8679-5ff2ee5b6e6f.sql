-- Add approval_comments to audits table for tracking approval history
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS approval_comments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.audits.approval_comments IS 'History of approval decisions and comments';

-- Create index for faster workflow_status queries
CREATE INDEX IF NOT EXISTS idx_audits_workflow_status ON public.audits(workflow_status);

-- Add trigger to validate status transitions
CREATE OR REPLACE FUNCTION validate_engagement_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Valid workflow: draft → pending_approval → approved → planned → active → fieldwork → reporting → complete → archived
  IF OLD.workflow_status IS NOT NULL AND NEW.workflow_status != OLD.workflow_status THEN
    -- Check valid transitions
    IF (OLD.workflow_status = 'draft' AND NEW.workflow_status NOT IN ('pending_approval', 'cancelled')) OR
       (OLD.workflow_status = 'pending_approval' AND NEW.workflow_status NOT IN ('approved', 'draft', 'cancelled')) OR
       (OLD.workflow_status = 'approved' AND NEW.workflow_status NOT IN ('planned', 'cancelled')) OR
       (OLD.workflow_status = 'planned' AND NEW.workflow_status NOT IN ('active', 'cancelled')) OR
       (OLD.workflow_status = 'active' AND NEW.workflow_status NOT IN ('fieldwork', 'cancelled')) OR
       (OLD.workflow_status = 'fieldwork' AND NEW.workflow_status NOT IN ('reporting', 'cancelled')) OR
       (OLD.workflow_status = 'reporting' AND NEW.workflow_status NOT IN ('complete', 'cancelled')) OR
       (OLD.workflow_status = 'complete' AND NEW.workflow_status NOT IN ('archived')) THEN
      RAISE EXCEPTION 'Invalid status transition from % to %', OLD.workflow_status, NEW.workflow_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_engagement_status_transitions
  BEFORE UPDATE ON public.audits
  FOR EACH ROW
  EXECUTE FUNCTION validate_engagement_status_transition();