-- ============================================================================
-- Migration: Add Audit Platform Tables
-- Version: 20251130120002
-- Description: Adds missing audit-specific tables (clients, engagements, audit tools)
-- Skips tables that already exist (organizations, organization_members, etc.)
-- ============================================================================

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  year_end DATE,
  client_type TEXT CHECK (client_type IN ('public', 'private', 'nonprofit', 'government')),
  risk_rating TEXT CHECK (risk_rating IN ('low', 'moderate', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's clients"
  ON clients FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's clients"
  ON clients FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- ENGAGEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('audit', 'review', 'compilation', 'tax', 'advisory')),
  fiscal_year_end DATE,
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'fieldwork', 'review', 'reporting', 'completed', 'archived')),
  engagement_partner_id UUID REFERENCES auth.users(id),
  engagement_manager_id UUID REFERENCES auth.users(id),
  materiality_amount DECIMAL(15,2),
  budget_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagements_organization ON engagements(organization_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);
CREATE INDEX IF NOT EXISTS idx_engagements_partner ON engagements(engagement_partner_id);
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's engagements"
  ON engagements FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's engagements"
  ON engagements FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- RISK ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  account_area TEXT NOT NULL,
  inherent_risk TEXT CHECK (inherent_risk IN ('low', 'moderate', 'high')),
  control_risk TEXT CHECK (control_risk IN ('low', 'moderate', 'high')),
  fraud_risk TEXT CHECK (fraud_risk IN ('low', 'moderate', 'high')),
  combined_risk TEXT CHECK (combined_risk IN ('low', 'moderate', 'high')),
  rationale TEXT,
  procedures_planned JSONB DEFAULT '[]',
  assessed_by UUID REFERENCES auth.users(id),
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_engagement ON risk_assessments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_combined_risk ON risk_assessments(combined_risk);
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's risk assessments"
  ON risk_assessments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's risk assessments"
  ON risk_assessments FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT PROGRAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_area TEXT NOT NULL,
  assertions JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_programs_engagement ON audit_programs(engagement_id);
ALTER TABLE audit_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit programs"
  ON audit_programs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit programs"
  ON audit_programs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT PROCEDURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES audit_programs(id) ON DELETE CASCADE,
  procedure_number TEXT,
  description TEXT NOT NULL,
  procedure_type TEXT CHECK (procedure_type IN ('substantive', 'test_of_controls', 'analytical', 'inquiry', 'observation', 'inspection')),
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'reviewed')),
  work_performed TEXT,
  conclusion TEXT,
  exceptions TEXT,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_procedures_program ON audit_procedures(program_id);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_assigned ON audit_procedures(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_procedures_status ON audit_procedures(status);
ALTER TABLE audit_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit procedures"
  ON audit_procedures FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit procedures"
  ON audit_procedures FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- MATERIALITY CALCULATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS materiality_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  benchmark_type TEXT CHECK (benchmark_type IN ('total_assets', 'total_revenue', 'gross_profit', 'net_income', 'total_equity', 'custom')),
  benchmark_amount DECIMAL(15,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  overall_materiality DECIMAL(15,2) NOT NULL,
  performance_materiality DECIMAL(15,2) NOT NULL,
  clearly_trivial DECIMAL(15,2) NOT NULL,
  component_allocations JSONB DEFAULT '[]',
  rationale TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiality_engagement ON materiality_calculations(engagement_id);
ALTER TABLE materiality_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's materiality calculations"
  ON materiality_calculations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's materiality calculations"
  ON materiality_calculations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- SAMPLING PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sampling_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE SET NULL,
  sampling_method TEXT CHECK (sampling_method IN ('mus', 'classical_variables', 'attributes')),
  population_size INTEGER NOT NULL,
  population_value DECIMAL(15,2),
  confidence_level INTEGER CHECK (confidence_level IN (90, 95, 99)),
  tolerable_misstatement DECIMAL(15,2),
  expected_misstatement DECIMAL(15,2),
  expected_error_rate DECIMAL(5,2),
  tolerable_error_rate DECIMAL(5,2),
  sample_size INTEGER NOT NULL,
  calculation_details JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sampling_engagement ON sampling_plans(engagement_id);
CREATE INDEX IF NOT EXISTS idx_sampling_procedure ON sampling_plans(procedure_id);
ALTER TABLE sampling_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's sampling plans"
  ON sampling_plans FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's sampling plans"
  ON sampling_plans FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- CONFIRMATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  confirmation_type TEXT CHECK (confirmation_type IN ('accounts_receivable', 'accounts_payable', 'bank', 'legal', 'other')),
  party_name TEXT NOT NULL,
  party_contact TEXT,
  amount DECIMAL(15,2),
  date_sent DATE,
  date_received DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'received', 'exception', 'resolved')),
  response_details TEXT,
  exceptions TEXT,
  follow_up_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_confirmations_engagement ON confirmations(engagement_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_status ON confirmations(status);
CREATE INDEX IF NOT EXISTS idx_confirmations_type ON confirmations(confirmation_type);
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's confirmations"
  ON confirmations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's confirmations"
  ON confirmations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- ANALYTICAL PROCEDURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytical_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  account_area TEXT NOT NULL,
  analysis_type TEXT CHECK (analysis_type IN ('ratio', 'trend', 'variance', 'reasonableness')),
  current_period_value DECIMAL(15,2),
  prior_period_value DECIMAL(15,2),
  expectation DECIMAL(15,2),
  variance_amount DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  threshold DECIMAL(5,2),
  exceeds_threshold BOOLEAN DEFAULT false,
  explanation TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytical_engagement ON analytical_procedures(engagement_id);
CREATE INDEX IF NOT EXISTS idx_analytical_threshold ON analytical_procedures(exceeds_threshold);
ALTER TABLE analytical_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's analytical procedures"
  ON analytical_procedures FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's analytical procedures"
  ON analytical_procedures FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT ADJUSTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  adjustment_type TEXT CHECK (adjustment_type IN ('aje', 'pje', 'sum')),
  entry_number TEXT,
  description TEXT NOT NULL,
  account_debited TEXT,
  account_credited TEXT,
  amount DECIMAL(15,2) NOT NULL,
  posted BOOLEAN DEFAULT false,
  impact_on_financials TEXT,
  rationale TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adjustments_engagement ON audit_adjustments(engagement_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_type ON audit_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_adjustments_posted ON audit_adjustments(posted);
ALTER TABLE audit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit adjustments"
  ON audit_adjustments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit adjustments"
  ON audit_adjustments FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT FINDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'moderate', 'low')),
  category TEXT CHECK (category IN ('control_deficiency', 'misstatement', 'compliance', 'other')),
  recommendation TEXT,
  management_response TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  identified_by UUID REFERENCES auth.users(id),
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_engagement ON audit_findings(engagement_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON audit_findings(status);
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit findings"
  ON audit_findings FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit findings"
  ON audit_findings FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- REVIEW NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('question', 'comment', 'action_required')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'responded', 'resolved')),
  response TEXT,
  created_by UUID REFERENCES auth.users(id),
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_notes_engagement ON review_notes(engagement_id);
CREATE INDEX IF NOT EXISTS idx_review_notes_status ON review_notes(status);
CREATE INDEX IF NOT EXISTS idx_review_notes_created_by ON review_notes(created_by);
ALTER TABLE review_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's review notes"
  ON review_notes FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's review notes"
  ON review_notes FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- SIGNOFFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  signoff_type TEXT CHECK (signoff_type IN ('procedure', 'program', 'section', 'engagement')),
  entity_id UUID NOT NULL,
  signoff_level TEXT CHECK (signoff_level IN ('preparer', 'reviewer', 'manager', 'partner')),
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signoffs_engagement ON signoffs(engagement_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_entity ON signoffs(entity_id);
CREATE INDEX IF NOT EXISTS idx_signoffs_signed_by ON signoffs(signed_by);
ALTER TABLE signoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's signoffs"
  ON signoffs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's signoffs"
  ON signoffs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('unmodified', 'qualified', 'adverse', 'disclaimer')),
  report_date DATE,
  content TEXT,
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_engagement ON audit_reports(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_final ON audit_reports(is_final);
ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit reports"
  ON audit_reports FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit reports"
  ON audit_reports FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT STRATEGY MEMOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_strategy_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_memos_engagement ON audit_strategy_memos(engagement_id);
ALTER TABLE audit_strategy_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's strategy memos"
  ON audit_strategy_memos FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's strategy memos"
  ON audit_strategy_memos FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_bucket TEXT DEFAULT 'audit-documents',
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_documents_engagement ON audit_documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_audit_documents_procedure ON audit_documents(procedure_id);
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit documents"
  ON audit_documents FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit documents"
  ON audit_documents FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- AUDIT TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_type TEXT CHECK (template_type IN ('program', 'procedure', 'memo', 'report', 'checklist')),
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_standard BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_templates_organization ON audit_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_templates_type ON audit_templates(template_type);
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's audit templates"
  ON audit_templates FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's audit templates"
  ON audit_templates FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251130120002 completed successfully!';
  RAISE NOTICE 'Added 18 audit platform tables:';
  RAISE NOTICE '  - clients, engagements';
  RAISE NOTICE '  - risk_assessments, audit_programs, audit_procedures';
  RAISE NOTICE '  - materiality_calculations, sampling_plans, confirmations';
  RAISE NOTICE '  - analytical_procedures, audit_adjustments, audit_findings';
  RAISE NOTICE '  - review_notes, signoffs, audit_reports, audit_strategy_memos';
  RAISE NOTICE '  - audit_documents, audit_templates';
END $$;
