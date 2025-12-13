-- ============================================================================
-- Migration: Review & Collaboration Tables
-- Version: 20251129_005
-- Description: Creates tables for review notes, sign-offs, audit reports, and strategy memos
-- Dependencies: 20251129_004_audit_tools.sql
-- ============================================================================

-- ============================================================================
-- REVIEW NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT NOT NULL,
  category TEXT CHECK (category IN ('question', 'suggestion', 'required_change', 'clarification', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'withdrawn')),
  preparer_response TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_notes_engagement ON review_notes(engagement_id);
CREATE INDEX IF NOT EXISTS idx_review_notes_procedure ON review_notes(procedure_id);
CREATE INDEX IF NOT EXISTS idx_review_notes_reviewer ON review_notes(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_notes_status ON review_notes(status);
CREATE INDEX IF NOT EXISTS idx_review_notes_organization ON review_notes(organization_id);

ALTER TABLE review_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SIGNOFFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('procedure', 'section', 'engagement', 'report')),
  entity_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('preparer', 'reviewer', 'manager', 'partner')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  signature_data JSONB DEFAULT '{
    "ip_address": "",
    "user_agent": "",
    "full_name": "",
    "title": ""
  }',
  comments TEXT,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signoffs_engagement ON signoffs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_entity ON signoffs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_user ON signoffs(user_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_role ON signoffs(role);
CREATE INDEX IF NOT EXISTS idx_signoffs_organization ON signoffs(organization_id);

ALTER TABLE signoffs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'unqualified',
    'qualified',
    'adverse',
    'disclaimer',
    'review_report',
    'compilation_report',
    'management_letter',
    'internal_control_report',
    'other'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'final', 'issued')),
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID[],
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  issued_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_engagement ON audit_reports(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_type ON audit_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_audit_reports_status ON audit_reports(status);
CREATE INDEX IF NOT EXISTS idx_audit_reports_organization ON audit_reports(organization_id);

ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT STRATEGY MEMOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_strategy_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_information JSONB DEFAULT '{
    "background": "",
    "significant_changes": "",
    "key_contacts": []
  }',
  engagement_information JSONB DEFAULT '{
    "engagement_objectives": "",
    "scope": "",
    "deliverables": [],
    "timeline": {}
  }',
  risk_assessment_summary JSONB DEFAULT '{
    "overall_assessment": "",
    "key_risks": [],
    "response_to_risks": ""
  }',
  audit_approach JSONB DEFAULT '{
    "materiality": {},
    "audit_strategy": "",
    "planned_procedures": []
  }',
  resource_allocation JSONB DEFAULT '{
    "team_members": [],
    "budget_hours": {},
    "specialists_required": []
  }',
  timeline JSONB DEFAULT '{
    "planning_phase": {},
    "fieldwork_phase": {},
    "reporting_phase": {}
  }',
  other_matters JSONB DEFAULT '{
    "independence": "",
    "quality_control": "",
    "consultation_required": []
  }',
  planning_checklist JSONB DEFAULT '[]',
  checklist_completion INTEGER DEFAULT 0 CHECK (checklist_completion >= 0 AND checklist_completion <= 100),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_strategy_memos_engagement ON audit_strategy_memos(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_strategy_memos_organization ON audit_strategy_memos(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_strategy_memos_status ON audit_strategy_memos(status);

ALTER TABLE audit_strategy_memos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'review_note',
    'sign_off_request',
    'sign_off_completed',
    'procedure_assigned',
    'finding_created',
    'adjustment_proposed',
    'engagement_milestone',
    'mention',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ACTIVITY LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_organization ON activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_engagement ON activity_log(engagement_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Review Notes Policies
CREATE POLICY "Organization members can view review notes"
  ON review_notes FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can create review notes"
  ON review_notes FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ) AND reviewer_id = auth.uid());

CREATE POLICY "Reviewer and assigned user can update review notes"
  ON review_notes FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) AND (
      reviewer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM audit_procedures
        WHERE id = review_notes.procedure_id
        AND assigned_to = auth.uid()
      )
    )
  );

-- Signoffs Policies
CREATE POLICY "Organization members can view signoffs"
  ON signoffs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own signoffs"
  ON signoffs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ) AND user_id = auth.uid());

-- Audit Reports Policies
CREATE POLICY "Organization members can view audit reports"
  ON audit_reports FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage audit reports"
  ON audit_reports FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Audit Strategy Memos Policies
CREATE POLICY "Organization members can view strategy memos"
  ON audit_strategy_memos FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage strategy memos"
  ON audit_strategy_memos FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Activity Log Policies
CREATE POLICY "Organization members can view activity log"
  ON activity_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can create activity log entries"
  ON activity_log FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_review_notes_updated_at
  BEFORE UPDATE ON review_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_reports_updated_at
  BEFORE UPDATE ON audit_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_strategy_memos_updated_at
  BEFORE UPDATE ON audit_strategy_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE user_id = auth.uid() AND read = false;

  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_organization_id UUID,
  p_engagement_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_changes JSONB,
  p_metadata JSONB
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_log (
    organization_id,
    engagement_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    metadata
  ) VALUES (
    p_organization_id,
    p_engagement_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes,
    p_metadata
  )
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE review_notes IS 'Stores review notes and questions for audit procedures';
COMMENT ON TABLE signoffs IS 'Stores digital sign-offs for procedures, sections, and engagements';
COMMENT ON TABLE audit_reports IS 'Stores audit reports with Tiptap JSON content';
COMMENT ON TABLE audit_strategy_memos IS 'Stores comprehensive audit strategy and planning memos';
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE activity_log IS 'Stores audit trail of all user actions';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_005_review_collaboration.sql completed successfully';
END $$;
