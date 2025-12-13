-- ============================================================================
-- Migration: Complete Audit Platform Tables (Final Clean Version)
-- Description: Creates all 17 audit tables with proper cleanup of orphaned indexes
-- ============================================================================

-- Drop orphaned indexes from previous failed migrations
DROP INDEX IF EXISTS public.idx_engagements_firm CASCADE;
DROP INDEX IF EXISTS public.idx_engagements_client CASCADE;
DROP INDEX IF EXISTS public.idx_engagements_status CASCADE;
DROP INDEX IF EXISTS public.idx_engagements_partner CASCADE;
DROP INDEX IF EXISTS public.idx_risk_assessments_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_risk_assessments_combined_risk CASCADE;
DROP INDEX IF EXISTS public.idx_audit_programs_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_audit_procedures_program CASCADE;
DROP INDEX IF EXISTS public.idx_audit_procedures_assigned CASCADE;
DROP INDEX IF EXISTS public.idx_audit_procedures_status CASCADE;
DROP INDEX IF EXISTS public.idx_materiality_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_sampling_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_sampling_procedure CASCADE;
DROP INDEX IF EXISTS public.idx_confirmations_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_confirmations_status CASCADE;
DROP INDEX IF EXISTS public.idx_confirmations_type CASCADE;
DROP INDEX IF EXISTS public.idx_analytical_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_analytical_threshold CASCADE;
DROP INDEX IF EXISTS public.idx_adjustments_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_adjustments_type CASCADE;
DROP INDEX IF EXISTS public.idx_adjustments_posted CASCADE;
DROP INDEX IF EXISTS public.idx_findings_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_findings_severity CASCADE;
DROP INDEX IF EXISTS public.idx_findings_status CASCADE;
DROP INDEX IF EXISTS public.idx_review_notes_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_review_notes_status CASCADE;
DROP INDEX IF EXISTS public.idx_review_notes_created_by CASCADE;
DROP INDEX IF EXISTS public.idx_signoffs_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_signoffs_entity CASCADE;
DROP INDEX IF EXISTS public.idx_signoffs_signed_by CASCADE;
DROP INDEX IF EXISTS public.idx_audit_reports_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_audit_reports_final CASCADE;
DROP INDEX IF EXISTS public.idx_strategy_memos_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_audit_documents_engagement CASCADE;
DROP INDEX IF EXISTS public.idx_audit_documents_procedure CASCADE;
DROP INDEX IF EXISTS public.idx_audit_templates_firm CASCADE;
DROP INDEX IF EXISTS public.idx_audit_templates_type CASCADE;

-- Drop existing tables (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS public.audit_templates CASCADE;
DROP TABLE IF EXISTS public.audit_documents CASCADE;
DROP TABLE IF EXISTS public.audit_strategy_memos CASCADE;
DROP TABLE IF EXISTS public.audit_reports CASCADE;
DROP TABLE IF EXISTS public.signoffs CASCADE;
DROP TABLE IF EXISTS public.review_notes CASCADE;
DROP TABLE IF EXISTS public.audit_findings CASCADE;
DROP TABLE IF EXISTS public.audit_adjustments CASCADE;
DROP TABLE IF EXISTS public.analytical_procedures CASCADE;
DROP TABLE IF EXISTS public.confirmations CASCADE;
DROP TABLE IF EXISTS public.sampling_plans CASCADE;
DROP TABLE IF EXISTS public.materiality_calculations CASCADE;
DROP TABLE IF EXISTS public.audit_procedures CASCADE;
DROP TABLE IF EXISTS public.audit_programs CASCADE;
DROP TABLE IF EXISTS public.risk_assessments CASCADE;
DROP TABLE IF EXISTS public.engagements CASCADE;

-- ============================================================================
-- TABLE 1: ENGAGEMENTS
-- ============================================================================
CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
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

CREATE INDEX idx_engagements_firm ON public.engagements(firm_id);
CREATE INDEX idx_engagements_client ON public.engagements(client_id);
CREATE INDEX idx_engagements_status ON public.engagements(status);
CREATE INDEX idx_engagements_partner ON public.engagements(engagement_partner_id);
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm engagements" ON public.engagements FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), firm_id));
CREATE POLICY "Users can manage their firm engagements" ON public.engagements FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 2: RISK ASSESSMENTS
-- ============================================================================
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
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

CREATE INDEX idx_risk_assessments_engagement ON public.risk_assessments(engagement_id);
CREATE INDEX idx_risk_assessments_combined_risk ON public.risk_assessments(combined_risk);
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage risk assessments" ON public.risk_assessments FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 3: AUDIT PROGRAMS
-- ============================================================================
CREATE TABLE public.audit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_area TEXT NOT NULL,
  assertions JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_programs_engagement ON public.audit_programs(engagement_id);
ALTER TABLE public.audit_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audit programs" ON public.audit_programs FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 4: AUDIT PROCEDURES
-- ============================================================================
CREATE TABLE public.audit_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.audit_programs(id) ON DELETE CASCADE,
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

CREATE INDEX idx_audit_procedures_program ON public.audit_procedures(program_id);
CREATE INDEX idx_audit_procedures_assigned ON public.audit_procedures(assigned_to);
CREATE INDEX idx_audit_procedures_status ON public.audit_procedures(status);
ALTER TABLE public.audit_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audit procedures" ON public.audit_procedures FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 5: MATERIALITY CALCULATIONS
-- ============================================================================
CREATE TABLE public.materiality_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
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

CREATE INDEX idx_materiality_engagement ON public.materiality_calculations(engagement_id);
ALTER TABLE public.materiality_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage materiality" ON public.materiality_calculations FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 6: SAMPLING PLANS
-- ============================================================================
CREATE TABLE public.sampling_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.audit_procedures(id) ON DELETE SET NULL,
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

CREATE INDEX idx_sampling_engagement ON public.sampling_plans(engagement_id);
CREATE INDEX idx_sampling_procedure ON public.sampling_plans(procedure_id);
ALTER TABLE public.sampling_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sampling" ON public.sampling_plans FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 7: CONFIRMATIONS
-- ============================================================================
CREATE TABLE public.confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
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

CREATE INDEX idx_confirmations_engagement ON public.confirmations(engagement_id);
CREATE INDEX idx_confirmations_status ON public.confirmations(status);
CREATE INDEX idx_confirmations_type ON public.confirmations(confirmation_type);
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage confirmations" ON public.confirmations FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 8: ANALYTICAL PROCEDURES
-- ============================================================================
CREATE TABLE public.analytical_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
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

CREATE INDEX idx_analytical_engagement ON public.analytical_procedures(engagement_id);
CREATE INDEX idx_analytical_threshold ON public.analytical_procedures(exceeds_threshold);
ALTER TABLE public.analytical_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analytical procedures" ON public.analytical_procedures FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 9: AUDIT ADJUSTMENTS
-- ============================================================================
CREATE TABLE public.audit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
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

CREATE INDEX idx_adjustments_engagement ON public.audit_adjustments(engagement_id);
CREATE INDEX idx_adjustments_type ON public.audit_adjustments(adjustment_type);
CREATE INDEX idx_adjustments_posted ON public.audit_adjustments(posted);
ALTER TABLE public.audit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage adjustments" ON public.audit_adjustments FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 10: AUDIT FINDINGS
-- ============================================================================
CREATE TABLE public.audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.audit_procedures(id) ON DELETE SET NULL,
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

CREATE INDEX idx_findings_engagement ON public.audit_findings(engagement_id);
CREATE INDEX idx_findings_severity ON public.audit_findings(severity);
CREATE INDEX idx_findings_status ON public.audit_findings(status);
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage findings" ON public.audit_findings FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 11: REVIEW NOTES
-- ============================================================================
CREATE TABLE public.review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.audit_procedures(id) ON DELETE SET NULL,
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

CREATE INDEX idx_review_notes_engagement ON public.review_notes(engagement_id);
CREATE INDEX idx_review_notes_status ON public.review_notes(status);
CREATE INDEX idx_review_notes_created_by ON public.review_notes(created_by);
ALTER TABLE public.review_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage review notes" ON public.review_notes FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 12: SIGNOFFS
-- ============================================================================
CREATE TABLE public.signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  signoff_type TEXT CHECK (signoff_type IN ('procedure', 'program', 'section', 'engagement')),
  entity_id UUID NOT NULL,
  signoff_level TEXT CHECK (signoff_level IN ('preparer', 'reviewer', 'manager', 'partner')),
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signoffs_engagement ON public.signoffs(engagement_id);
CREATE INDEX idx_signoffs_entity ON public.signoffs(entity_id);
CREATE INDEX idx_signoffs_signed_by ON public.signoffs(signed_by);
ALTER TABLE public.signoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage signoffs" ON public.signoffs FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 13: AUDIT REPORTS
-- ============================================================================
CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('unmodified', 'qualified', 'adverse', 'disclaimer')),
  report_date DATE,
  content TEXT,
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_reports_engagement ON public.audit_reports(engagement_id);
CREATE INDEX idx_audit_reports_final ON public.audit_reports(is_final);
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audit reports" ON public.audit_reports FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 14: AUDIT STRATEGY MEMOS
-- ============================================================================
CREATE TABLE public.audit_strategy_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategy_memos_engagement ON public.audit_strategy_memos(engagement_id);
ALTER TABLE public.audit_strategy_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage strategy memos" ON public.audit_strategy_memos FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 15: AUDIT DOCUMENTS
-- ============================================================================
CREATE TABLE public.audit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.audit_procedures(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  storage_bucket TEXT DEFAULT 'audit-documents',
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_documents_engagement ON public.audit_documents(engagement_id);
CREATE INDEX idx_audit_documents_procedure ON public.audit_documents(procedure_id);
ALTER TABLE public.audit_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audit documents" ON public.audit_documents FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));

-- ============================================================================
-- TABLE 16: AUDIT TEMPLATES
-- ============================================================================
CREATE TABLE public.audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  template_type TEXT CHECK (template_type IN ('program', 'procedure', 'memo', 'report', 'checklist')),
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  is_standard BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_templates_firm ON public.audit_templates(firm_id);
CREATE INDEX idx_audit_templates_type ON public.audit_templates(template_type);
ALTER TABLE public.audit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audit templates" ON public.audit_templates FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), firm_id));
