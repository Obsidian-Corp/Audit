-- ============================================================================
-- Migration: Audit Tools Tables
-- Version: 20251129_004
-- Description: Creates tables for materiality, sampling, confirmations, analytical procedures, findings, and adjustments
-- Dependencies: 20251129_003_audit_programs_procedures.sql
-- ============================================================================

-- ============================================================================
-- MATERIALITY CALCULATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS materiality_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN (
    'total_assets',
    'total_revenue',
    'gross_profit',
    'net_income',
    'total_equity',
    'custom'
  )),
  benchmark_amount DECIMAL(15,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  overall_materiality DECIMAL(15,2) NOT NULL,
  performance_materiality DECIMAL(15,2) NOT NULL,
  clearly_trivial DECIMAL(15,2) NOT NULL,
  component_allocations JSONB DEFAULT '[]',
  rationale TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiality_engagement ON materiality_calculations(engagement_id);
CREATE INDEX IF NOT EXISTS idx_materiality_organization ON materiality_calculations(organization_id);

ALTER TABLE materiality_calculations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SAMPLING PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sampling_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE CASCADE,
  sampling_method TEXT NOT NULL CHECK (sampling_method IN ('mus', 'classical_variables', 'attributes')),
  population_size INTEGER NOT NULL CHECK (population_size > 0),
  population_value DECIMAL(15,2),
  confidence_level DECIMAL(5,2) NOT NULL CHECK (confidence_level IN (90, 95, 99)),
  tolerable_misstatement DECIMAL(15,2),
  expected_misstatement DECIMAL(15,2),
  expected_error_rate DECIMAL(5,2),
  tolerable_error_rate DECIMAL(5,2),
  sample_size INTEGER NOT NULL CHECK (sample_size > 0),
  calculation_details JSONB NOT NULL DEFAULT '{}',
  selected_items JSONB DEFAULT '[]',
  results JSONB DEFAULT '{
    "items_tested": 0,
    "exceptions_found": 0,
    "total_misstatement": 0,
    "projected_misstatement": 0,
    "conclusion": ""
  }',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sampling_plans_engagement ON sampling_plans(engagement_id);
CREATE INDEX IF NOT EXISTS idx_sampling_plans_procedure ON sampling_plans(procedure_id);
CREATE INDEX IF NOT EXISTS idx_sampling_plans_organization ON sampling_plans(organization_id);

ALTER TABLE sampling_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONFIRMATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('ar', 'ap', 'bank', 'legal', 'other')),
  account_name TEXT NOT NULL,
  account_number TEXT,
  balance DECIMAL(15,2),
  status TEXT DEFAULT 'not_sent' CHECK (status IN (
    'not_sent',
    'sent',
    'received',
    'reconciled',
    'exception',
    'alternative_procedures'
  )),
  sent_date DATE,
  response_date DATE,
  confirmed_balance DECIMAL(15,2),
  exceptions JSONB DEFAULT '[]',
  alternative_procedures JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_confirmations_engagement ON confirmations(engagement_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_type ON confirmations(confirmation_type);
CREATE INDEX IF NOT EXISTS idx_confirmations_status ON confirmations(status);
CREATE INDEX IF NOT EXISTS idx_confirmations_organization ON confirmations(organization_id);

ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ANALYTICAL PROCEDURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytical_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('ratio', 'trend', 'variance', 'benford')),
  title TEXT NOT NULL,
  current_period_data JSONB NOT NULL DEFAULT '{}',
  prior_period_data JSONB DEFAULT '{}',
  industry_benchmarks JSONB DEFAULT '{}',
  calculated_ratios JSONB DEFAULT '{}',
  variance_analysis JSONB DEFAULT '{}',
  threshold_exceeded BOOLEAN DEFAULT false,
  explanation TEXT,
  follow_up_procedures JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytical_procedures_engagement ON analytical_procedures(engagement_id);
CREATE INDEX IF NOT EXISTS idx_analytical_procedures_type ON analytical_procedures(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analytical_procedures_organization ON analytical_procedures(organization_id);

ALTER TABLE analytical_procedures ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT FINDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id),
  finding_type TEXT NOT NULL CHECK (finding_type IN (
    'control_deficiency',
    'significant_deficiency',
    'material_weakness',
    'misstatement',
    'disclosure',
    'compliance',
    'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'significant', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_description TEXT,
  quantitative_impact DECIMAL(15,2),
  risk_areas JSONB DEFAULT '[]',
  management_response TEXT,
  remediation_plan TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted_risk')),
  due_date DATE,
  resolved_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_engagement ON audit_findings(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_type ON audit_findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_audit_findings_organization ON audit_findings(organization_id);

ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT ADJUSTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('aje', 'pje', 'sum')),
  number TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  materiality_impact DECIMAL(15,2),
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'posted', 'passed')),
  rationale TEXT,
  finding_id UUID REFERENCES audit_findings(id),
  proposed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(engagement_id, number)
);

CREATE INDEX IF NOT EXISTS idx_audit_adjustments_engagement ON audit_adjustments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_adjustments_type ON audit_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_audit_adjustments_status ON audit_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_audit_adjustments_finding ON audit_adjustments(finding_id);
CREATE INDEX IF NOT EXISTS idx_audit_adjustments_organization ON audit_adjustments(organization_id);

ALTER TABLE audit_adjustments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Materiality Calculations Policies
CREATE POLICY "Organization members can view materiality"
  ON materiality_calculations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage materiality"
  ON materiality_calculations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Sampling Plans Policies
CREATE POLICY "Organization members can view sampling plans"
  ON sampling_plans FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage sampling plans"
  ON sampling_plans FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Confirmations Policies
CREATE POLICY "Organization members can view confirmations"
  ON confirmations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage confirmations"
  ON confirmations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Analytical Procedures Policies
CREATE POLICY "Organization members can view analytical procedures"
  ON analytical_procedures FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage analytical procedures"
  ON analytical_procedures FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Audit Findings Policies
CREATE POLICY "Organization members can view findings"
  ON audit_findings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage findings"
  ON audit_findings FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Audit Adjustments Policies
CREATE POLICY "Organization members can view adjustments"
  ON audit_adjustments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can propose adjustments"
  ON audit_adjustments FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can update adjustments"
  ON audit_adjustments FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_materiality_calculations_updated_at
  BEFORE UPDATE ON materiality_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sampling_plans_updated_at
  BEFORE UPDATE ON sampling_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_confirmations_updated_at
  BEFORE UPDATE ON confirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytical_procedures_updated_at
  BEFORE UPDATE ON analytical_procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at
  BEFORE UPDATE ON audit_findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_adjustments_updated_at
  BEFORE UPDATE ON audit_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE materiality_calculations IS 'Stores materiality calculations for audit engagements';
COMMENT ON TABLE sampling_plans IS 'Stores statistical sampling plans and results';
COMMENT ON TABLE confirmations IS 'Stores confirmation requests and responses';
COMMENT ON TABLE analytical_procedures IS 'Stores analytical procedure analyses';
COMMENT ON TABLE audit_findings IS 'Stores audit findings, deficiencies, and issues';
COMMENT ON TABLE audit_adjustments IS 'Stores proposed and posted audit adjustments';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_004_audit_tools.sql completed successfully';
END $$;
