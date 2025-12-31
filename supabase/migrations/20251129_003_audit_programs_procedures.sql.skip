-- ============================================================================
-- Migration: Audit Programs & Procedures Tables
-- Version: 20251129_003
-- Description: Creates tables for risk assessments, audit programs, and procedures
-- Dependencies: 20251129_002_clients_engagements.sql
-- ============================================================================

-- ============================================================================
-- RISK ASSESSMENTS TABLE
-- ============================================================================
-- Stores comprehensive risk assessment data for engagements
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_profile JSONB NOT NULL DEFAULT '{
    "nature_of_business": "",
    "organizational_structure": "",
    "key_products_services": [],
    "revenue_sources": [],
    "geographic_locations": []
  }',
  risk_areas JSONB NOT NULL DEFAULT '[]',
  fraud_assessment JSONB DEFAULT '{
    "incentives_pressures": [],
    "opportunities": [],
    "attitudes_rationalizations": [],
    "overall_fraud_risk": "low"
  }',
  it_assessment JSONB DEFAULT '{
    "systems_used": [],
    "controls_evaluation": "",
    "cybersecurity_risks": [],
    "it_general_controls": ""
  }',
  overall_risk_rating TEXT CHECK (overall_risk_rating IN ('low', 'medium', 'high', 'very_high')),
  heat_map_data JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'reassessed')),
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for risk_assessments
CREATE INDEX IF NOT EXISTS idx_risk_assessments_engagement ON risk_assessments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_organization ON risk_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments(status);

-- Enable RLS on risk_assessments
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT PROGRAMS TABLE
-- ============================================================================
-- Stores audit program information
CREATE TABLE IF NOT EXISTS audit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID,
  risk_assessment_id UUID REFERENCES risk_assessments(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'template')),
  total_procedures INTEGER DEFAULT 0,
  completed_procedures INTEGER DEFAULT 0,
  estimated_hours DECIMAL(8,2) DEFAULT 0,
  actual_hours DECIMAL(8,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit_programs
CREATE INDEX IF NOT EXISTS idx_audit_programs_engagement ON audit_programs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_programs_organization ON audit_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_programs_status ON audit_programs(status);
CREATE INDEX IF NOT EXISTS idx_audit_programs_template ON audit_programs(template_id);

-- Enable RLS on audit_programs
ALTER TABLE audit_programs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT PROCEDURES TABLE
-- ============================================================================
-- Stores individual audit procedures
CREATE TABLE IF NOT EXISTS audit_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES audit_programs(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  instructions TEXT,
  category TEXT CHECK (category IN (
    'planning',
    'risk_assessment',
    'internal_controls',
    'substantive_testing',
    'analytical_procedures',
    'confirmations',
    'observations',
    'inquiries',
    'completion',
    'other'
  )),
  priority TEXT DEFAULT 'required' CHECK (priority IN ('required', 'recommended', 'optional')),
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'reviewed',
    'approved',
    'deferred'
  )),
  assigned_to UUID REFERENCES auth.users(id),
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2) DEFAULT 0,
  evidence_checklist JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  conclusion TEXT,
  preparer_signoff JSONB,
  reviewer_signoff JSONB,
  manager_signoff JSONB,
  partner_signoff JSONB,
  sequence_number INTEGER,
  parent_procedure_id UUID REFERENCES audit_procedures(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, code)
);

-- Create indexes for audit_procedures
CREATE INDEX IF NOT EXISTS idx_audit_procedures_program ON audit_procedures(program_id);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_engagement ON audit_procedures(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_organization ON audit_procedures(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_assigned ON audit_procedures(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_status ON audit_procedures(status);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_category ON audit_procedures(category);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_parent ON audit_procedures(parent_procedure_id);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_code ON audit_procedures(code);

-- Enable RLS on audit_procedures
ALTER TABLE audit_procedures ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Risk Assessments Policies
-- -----------------------------------------------
CREATE POLICY "Organization members can view risk assessments"
  ON risk_assessments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage risk assessments"
  ON risk_assessments FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Audit Programs Policies
-- -----------------------------------------------
CREATE POLICY "Organization members can view audit programs"
  ON audit_programs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage audit programs"
  ON audit_programs FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Audit Procedures Policies
-- -----------------------------------------------
CREATE POLICY "Organization members can view procedures"
  ON audit_procedures FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can insert procedures"
  ON audit_procedures FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Assigned users and managers can update procedures"
  ON audit_procedures FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ) AND (
      assigned_to = auth.uid() OR
      auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = audit_procedures.organization_id
        AND role IN ('partner', 'manager', 'admin')
      )
    )
  );

CREATE POLICY "Managers can delete procedures"
  ON audit_procedures FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner', 'manager')
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for risk_assessments updated_at
CREATE TRIGGER update_risk_assessments_updated_at
  BEFORE UPDATE ON risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for audit_programs updated_at
CREATE TRIGGER update_audit_programs_updated_at
  BEFORE UPDATE ON audit_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for audit_procedures updated_at
CREATE TRIGGER update_audit_procedures_updated_at
  BEFORE UPDATE ON audit_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate program completion percentage
CREATE OR REPLACE FUNCTION calculate_program_completion(program_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total INTEGER;
  completed INTEGER;
BEGIN
  SELECT COUNT(*) INTO total
  FROM audit_procedures
  WHERE program_id = calculate_program_completion.program_id;

  SELECT COUNT(*) INTO completed
  FROM audit_procedures
  WHERE program_id = calculate_program_completion.program_id
  AND status IN ('completed', 'reviewed', 'approved');

  IF total = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((completed::DECIMAL / total::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update program statistics
CREATE OR REPLACE FUNCTION update_program_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE audit_programs
  SET
    total_procedures = (
      SELECT COUNT(*)
      FROM audit_procedures
      WHERE program_id = COALESCE(NEW.program_id, OLD.program_id)
    ),
    completed_procedures = (
      SELECT COUNT(*)
      FROM audit_procedures
      WHERE program_id = COALESCE(NEW.program_id, OLD.program_id)
      AND status IN ('completed', 'reviewed', 'approved')
    ),
    actual_hours = (
      SELECT COALESCE(SUM(actual_hours), 0)
      FROM audit_procedures
      WHERE program_id = COALESCE(NEW.program_id, OLD.program_id)
    ),
    estimated_hours = (
      SELECT COALESCE(SUM(estimated_hours), 0)
      FROM audit_procedures
      WHERE program_id = COALESCE(NEW.program_id, OLD.program_id)
    )
  WHERE id = COALESCE(NEW.program_id, OLD.program_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update program statistics when procedures change
CREATE TRIGGER update_program_stats_on_procedure_change
  AFTER INSERT OR UPDATE OR DELETE ON audit_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_program_statistics();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for procedure summary with assignee info
CREATE OR REPLACE VIEW procedure_summary AS
SELECT
  ap.id,
  ap.program_id,
  ap.engagement_id,
  ap.organization_id,
  ap.code,
  ap.title,
  ap.category,
  ap.priority,
  ap.status,
  ap.assigned_to,
  up.full_name AS assignee_name,
  ap.estimated_hours,
  ap.actual_hours,
  CASE
    WHEN ap.estimated_hours > 0
    THEN ROUND((ap.actual_hours / ap.estimated_hours) * 100, 2)
    ELSE 0
  END AS hours_utilization_percent,
  ap.preparer_signoff IS NOT NULL AS has_preparer_signoff,
  ap.reviewer_signoff IS NOT NULL AS has_reviewer_signoff,
  ap.manager_signoff IS NOT NULL AS has_manager_signoff,
  ap.partner_signoff IS NOT NULL AS has_partner_signoff,
  ap.created_at,
  ap.updated_at
FROM audit_procedures ap
LEFT JOIN user_profiles up ON ap.assigned_to = up.id;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE risk_assessments IS 'Stores comprehensive risk assessment data for audit engagements';
COMMENT ON TABLE audit_programs IS 'Stores audit program information linking procedures to engagements';
COMMENT ON TABLE audit_procedures IS 'Stores individual audit procedures with status tracking and sign-offs';

COMMENT ON COLUMN risk_assessments.business_profile IS 'JSON object containing client business profile information';
COMMENT ON COLUMN risk_assessments.risk_areas IS 'JSON array of identified risk areas with likelihood and impact';
COMMENT ON COLUMN risk_assessments.fraud_assessment IS 'JSON object containing fraud risk triangle assessment';
COMMENT ON COLUMN audit_procedures.evidence_checklist IS 'JSON array of evidence items to be collected';
COMMENT ON COLUMN audit_procedures.exceptions IS 'JSON array of exceptions or issues identified';
COMMENT ON COLUMN audit_procedures.preparer_signoff IS 'JSON object with user_id, timestamp, and signature data';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_003_audit_programs_procedures.sql completed successfully';
END $$;
