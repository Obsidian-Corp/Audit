-- =====================================================
-- PHASE 1: ENTERPRISE AUDIT MANAGEMENT DATABASE SCHEMA
-- =====================================================
-- Financial auditing platform modeled after SAP Audit Management
-- Compliance: SOX, IFRS, GAAP, GDPR, ISO 27001

-- =====================================================
-- 1. AUDIT UNIVERSE & RISK ASSESSMENT
-- =====================================================

-- Auditable entities (departments, processes, accounts)
CREATE TABLE public.audit_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  entity_code TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'department', 'process', 'account', 'system'
  description TEXT,
  parent_entity_id UUID REFERENCES public.audit_entities(id),
  risk_score NUMERIC(5,2) DEFAULT 0, -- 0-100 scale
  last_audit_date DATE,
  next_audit_date DATE,
  audit_frequency TEXT DEFAULT 'annual', -- 'quarterly', 'annual', 'biannual'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, entity_code)
);

-- Risk assessments
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  entity_id UUID REFERENCES public.audit_entities(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  likelihood_score INTEGER NOT NULL CHECK (likelihood_score BETWEEN 1 AND 5),
  impact_score INTEGER NOT NULL CHECK (impact_score BETWEEN 1 AND 5),
  inherent_risk NUMERIC(5,2) GENERATED ALWAYS AS (likelihood_score * impact_score * 4.0) STORED,
  control_effectiveness INTEGER CHECK (control_effectiveness BETWEEN 1 AND 5),
  residual_risk NUMERIC(5,2),
  risk_category TEXT, -- 'financial', 'operational', 'compliance', 'strategic'
  risk_description TEXT,
  mitigation_strategy TEXT,
  assessed_by UUID,
  reviewed_by UUID,
  review_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. AUDIT PLANNING
-- =====================================================

-- Annual/quarterly audit plans
CREATE TABLE public.audit_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_year INTEGER NOT NULL,
  plan_period TEXT NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4', 'Annual'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget NUMERIC(15,2),
  allocated_hours INTEGER,
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'in_progress', 'completed'
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual audits within a plan
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  audit_plan_id UUID REFERENCES public.audit_plans(id) ON DELETE CASCADE,
  audit_number TEXT NOT NULL,
  audit_title TEXT NOT NULL,
  audit_type TEXT NOT NULL, -- 'financial', 'operational', 'compliance', 'it', 'integrated'
  entity_id UUID REFERENCES public.audit_entities(id),
  objective TEXT,
  scope TEXT,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status TEXT DEFAULT 'planned', -- 'planned', 'in_preparation', 'fieldwork', 'reporting', 'closed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  budget_allocated NUMERIC(15,2),
  budget_spent NUMERIC(15,2) DEFAULT 0,
  hours_allocated INTEGER,
  hours_spent INTEGER DEFAULT 0,
  lead_auditor_id UUID,
  manager_id UUID,
  risk_rating TEXT, -- 'low', 'medium', 'high', 'critical'
  compliance_standards TEXT[], -- ['SOX', 'IFRS', 'GAAP', 'GDPR', 'ISO27001']
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, audit_number)
);

-- Audit team members
CREATE TABLE public.audit_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'lead_auditor', 'senior_auditor', 'auditor', 'specialist'
  allocated_hours INTEGER,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, user_id)
);

-- =====================================================
-- 3. AUDIT PREPARATION & PROGRAMS
-- =====================================================

-- Audit work programs (test plans)
CREATE TABLE public.audit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  program_name TEXT NOT NULL,
  program_type TEXT, -- 'standard', 'custom', 'template'
  control_objective TEXT,
  test_procedures JSONB DEFAULT '[]', -- Array of test steps
  sample_size INTEGER,
  sampling_method TEXT, -- 'random', 'systematic', 'judgmental', 'stratified'
  assigned_to UUID,
  due_date DATE,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'reviewed'
  completion_percentage INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. AUDIT EXECUTION & EVIDENCE
-- =====================================================

-- Audit working papers
CREATE TABLE public.audit_workpapers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.audit_programs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  reference_number TEXT NOT NULL,
  title TEXT NOT NULL,
  workpaper_type TEXT, -- 'testing', 'analysis', 'documentation', 'memo'
  content JSONB DEFAULT '{}',
  prepared_by UUID,
  prepared_date DATE DEFAULT CURRENT_DATE,
  reviewed_by UUID,
  reviewed_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'review', 'approved'
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit evidence/documentation
CREATE TABLE public.audit_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  workpaper_id UUID REFERENCES public.audit_workpapers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  evidence_number TEXT NOT NULL,
  evidence_type TEXT NOT NULL, -- 'document', 'photo', 'screenshot', 'interview', 'observation', 'calculation'
  title TEXT NOT NULL,
  description TEXT,
  source TEXT, -- Where evidence was obtained
  collection_method TEXT, -- 'inquiry', 'inspection', 'observation', 'recalculation'
  storage_path TEXT, -- File storage path
  file_size BIGINT,
  mime_type TEXT,
  collected_by UUID,
  collected_date DATE DEFAULT CURRENT_DATE,
  verified_by UUID,
  verification_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. FINDINGS & ISSUES MANAGEMENT
-- =====================================================

-- Audit findings
CREATE TABLE public.audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  finding_number TEXT NOT NULL,
  finding_title TEXT NOT NULL,
  finding_type TEXT NOT NULL, -- 'deficiency', 'observation', 'recommendation', 'non_compliance'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  risk_rating TEXT, -- 'low', 'moderate', 'significant', 'material_weakness'
  condition_description TEXT NOT NULL, -- What was found
  criteria TEXT, -- What should be
  cause TEXT, -- Why it happened
  effect TEXT, -- Impact/consequence
  recommendation TEXT, -- What should be done
  management_response TEXT,
  corrective_action_plan TEXT,
  responsible_party UUID,
  target_completion_date DATE,
  actual_completion_date DATE,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed', 'accepted_risk'
  repeat_finding BOOLEAN DEFAULT false,
  previous_finding_id UUID,
  financial_impact NUMERIC(15,2),
  attachments JSONB DEFAULT '[]',
  identified_by UUID,
  identified_date DATE DEFAULT CURRENT_DATE,
  reviewed_by UUID,
  review_date DATE,
  closed_by UUID,
  closed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, finding_number)
);

-- Finding follow-up activities
CREATE TABLE public.finding_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES public.audit_findings(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL DEFAULT CURRENT_DATE,
  follow_up_type TEXT, -- 'progress_update', 'evidence_review', 'verification'
  comments TEXT,
  status_update TEXT,
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. REPORTING
-- =====================================================

-- Audit reports
CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  report_number TEXT NOT NULL,
  report_title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'draft', 'interim', 'final', 'management_letter', 'executive_summary'
  report_date DATE DEFAULT CURRENT_DATE,
  executive_summary TEXT,
  opinion TEXT, -- 'unqualified', 'qualified', 'adverse', 'disclaimer'
  overall_conclusion TEXT,
  report_content JSONB DEFAULT '{}', -- Structured report sections
  attachments JSONB DEFAULT '[]',
  prepared_by UUID,
  reviewed_by UUID,
  approved_by UUID,
  approved_date DATE,
  distribution_list TEXT[], -- Emails/user IDs for distribution
  status TEXT DEFAULT 'draft', -- 'draft', 'review', 'approved', 'distributed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. ANALYTICS & METRICS
-- =====================================================

-- KPI metrics for dashboards
CREATE TABLE public.audit_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL, -- 'audit_cycle_time', 'finding_resolution_rate', 'budget_variance', etc.
  metric_value NUMERIC,
  metric_unit TEXT, -- 'days', 'percentage', 'count', 'currency'
  dimension JSONB DEFAULT '{}', -- Additional breakdown dimensions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_audit_entities_org ON public.audit_entities(organization_id);
CREATE INDEX idx_risk_assessments_org_entity ON public.risk_assessments(organization_id, entity_id);
CREATE INDEX idx_audit_plans_org_year ON public.audit_plans(organization_id, plan_year);
CREATE INDEX idx_audits_org_status ON public.audits(organization_id, status);
CREATE INDEX idx_audits_plan ON public.audits(audit_plan_id);
CREATE INDEX idx_audit_programs_audit ON public.audit_programs(audit_id);
CREATE INDEX idx_audit_workpapers_audit ON public.audit_workpapers(audit_id);
CREATE INDEX idx_audit_evidence_audit ON public.audit_evidence(audit_id);
CREATE INDEX idx_audit_findings_audit_status ON public.audit_findings(audit_id, status);
CREATE INDEX idx_audit_reports_audit ON public.audit_reports(audit_id);
CREATE INDEX idx_audit_metrics_org_date ON public.audit_metrics(organization_id, metric_date);

-- Full-text search indexes
CREATE INDEX idx_audits_title_search ON public.audits USING gin(to_tsvector('english', audit_title));
CREATE INDEX idx_findings_search ON public.audit_findings USING gin(to_tsvector('english', finding_title || ' ' || COALESCE(condition_description, '')));

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.audit_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_workpapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_metrics ENABLE ROW LEVEL SECURITY;

-- Audit Entities Policies
CREATE POLICY "Org members can view audit entities"
  ON public.audit_entities FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins and auditors can manage audit entities"
  ON public.audit_entities FOR ALL
  USING (
    has_role(auth.uid(), organization_id, 'org_admin') OR
    has_role(auth.uid(), organization_id, 'auditor')
  );

-- Risk Assessments Policies
CREATE POLICY "Org members can view risk assessments"
  ON public.risk_assessments FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Auditors can create risk assessments"
  ON public.risk_assessments FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND assessed_by = auth.uid());

CREATE POLICY "Auditors can update their risk assessments"
  ON public.risk_assessments FOR UPDATE
  USING (assessed_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'));

-- Audit Plans Policies
CREATE POLICY "Org members can view audit plans"
  ON public.audit_plans FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage audit plans"
  ON public.audit_plans FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

-- Audits Policies
CREATE POLICY "Org members can view audits"
  ON public.audits FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Audit managers can create audits"
  ON public.audits FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Audit leads and admins can update audits"
  ON public.audits FOR UPDATE
  USING (
    lead_auditor_id = auth.uid() OR
    manager_id = auth.uid() OR
    has_role(auth.uid(), organization_id, 'org_admin')
  );

-- Audit Team Members Policies
CREATE POLICY "Team members can view audit team"
  ON public.audit_team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    audit_id IN (SELECT id FROM audits WHERE lead_auditor_id = auth.uid() OR manager_id = auth.uid())
  );

CREATE POLICY "Audit leads can manage team members"
  ON public.audit_team_members FOR ALL
  USING (
    audit_id IN (SELECT id FROM audits WHERE lead_auditor_id = auth.uid() OR manager_id = auth.uid())
  );

-- Audit Programs Policies
CREATE POLICY "Audit team can view programs"
  ON public.audit_programs FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id) AND (
      assigned_to = auth.uid() OR
      audit_id IN (SELECT audit_id FROM audit_team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Auditors can manage their programs"
  ON public.audit_programs FOR ALL
  USING (
    assigned_to = auth.uid() OR
    audit_id IN (SELECT id FROM audits WHERE lead_auditor_id = auth.uid())
  );

-- Audit Workpapers Policies
CREATE POLICY "Audit team can view workpapers"
  ON public.audit_workpapers FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id) AND (
      prepared_by = auth.uid() OR
      reviewed_by = auth.uid() OR
      audit_id IN (SELECT audit_id FROM audit_team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Auditors can create workpapers"
  ON public.audit_workpapers FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) AND prepared_by = auth.uid()
  );

CREATE POLICY "Preparers and reviewers can update workpapers"
  ON public.audit_workpapers FOR UPDATE
  USING (prepared_by = auth.uid() OR reviewed_by = auth.uid());

-- Audit Evidence Policies
CREATE POLICY "Audit team can view evidence"
  ON public.audit_evidence FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id) AND (
      collected_by = auth.uid() OR
      verified_by = auth.uid() OR
      audit_id IN (SELECT audit_id FROM audit_team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Auditors can create evidence"
  ON public.audit_evidence FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) AND collected_by = auth.uid()
  );

-- Audit Findings Policies
CREATE POLICY "Org members can view findings"
  ON public.audit_findings FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Auditors can create findings"
  ON public.audit_findings FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) AND identified_by = auth.uid()
  );

CREATE POLICY "Audit team can update findings"
  ON public.audit_findings FOR UPDATE
  USING (
    identified_by = auth.uid() OR
    responsible_party = auth.uid() OR
    audit_id IN (SELECT id FROM audits WHERE lead_auditor_id = auth.uid()) OR
    has_role(auth.uid(), organization_id, 'org_admin')
  );

-- Finding Follow-ups Policies
CREATE POLICY "Users can view follow-ups for their findings"
  ON public.finding_follow_ups FOR SELECT
  USING (
    finding_id IN (SELECT id FROM audit_findings WHERE
      responsible_party = auth.uid() OR
      identified_by = auth.uid() OR
      is_org_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Auditors can create follow-ups"
  ON public.finding_follow_ups FOR INSERT
  WITH CHECK (performed_by = auth.uid());

-- Audit Reports Policies
CREATE POLICY "Org members can view reports"
  ON public.audit_reports FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Audit team can manage reports"
  ON public.audit_reports FOR ALL
  USING (
    prepared_by = auth.uid() OR
    reviewed_by = auth.uid() OR
    approved_by = auth.uid() OR
    audit_id IN (SELECT id FROM audits WHERE lead_auditor_id = auth.uid()) OR
    has_role(auth.uid(), organization_id, 'org_admin')
  );

-- Audit Metrics Policies
CREATE POLICY "Org members can view metrics"
  ON public.audit_metrics FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage metrics"
  ON public.audit_metrics FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_audit_entities_updated_at BEFORE UPDATE ON public.audit_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_plans_updated_at BEFORE UPDATE ON public.audit_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_programs_updated_at BEFORE UPDATE ON public.audit_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_workpapers_updated_at BEFORE UPDATE ON public.audit_workpapers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_evidence_updated_at BEFORE UPDATE ON public.audit_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at BEFORE UPDATE ON public.audit_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_reports_updated_at BEFORE UPDATE ON public.audit_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();