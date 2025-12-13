-- Phase 1: Audit Programs & Methodology Module Database Schema

-- 1. Audit Program Templates (Library of reusable programs)
CREATE TABLE IF NOT EXISTS public.audit_program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  audit_type TEXT NOT NULL, -- SOC2, Financial, ITGC, HIPAA, ISO27001, COSO
  industry TEXT, -- Healthcare, Financial Services, Technology, etc.
  description TEXT,
  is_standard BOOLEAN DEFAULT false, -- true for pre-built templates
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Audit Procedures (Library of reusable test procedures)
CREATE TABLE IF NOT EXISTS public.audit_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  procedure_code TEXT NOT NULL, -- Unique identifier like "AC-001"
  category TEXT NOT NULL, -- walkthrough, control_test, substantive, analytical, inquiry
  objective TEXT,
  instructions JSONB, -- Rich text content
  sample_size_guidance TEXT,
  evidence_requirements JSONB DEFAULT '[]'::jsonb,
  expected_outcomes TEXT,
  estimated_hours NUMERIC DEFAULT 0,
  risk_level TEXT DEFAULT 'medium', -- high, medium, low
  control_objectives JSONB DEFAULT '[]'::jsonb,
  procedure_type TEXT DEFAULT 'standard', -- standard, custom
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, procedure_code)
);

-- 3. Program Procedures (Many-to-many: templates → procedures)
CREATE TABLE IF NOT EXISTS public.program_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_template_id UUID NOT NULL REFERENCES public.audit_program_templates(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.audit_procedures(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  can_be_customized BOOLEAN DEFAULT true,
  default_assigned_role TEXT, -- partner, manager, senior, staff
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_template_id, procedure_id)
);

-- 4. Engagement Programs (Program applied to engagement)
CREATE TABLE IF NOT EXISTS public.engagement_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  program_template_id UUID REFERENCES public.audit_program_templates(id),
  program_name TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, active, complete
  total_procedures INTEGER DEFAULT 0,
  completed_procedures INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Engagement Procedures (Procedures assigned to team)
CREATE TABLE IF NOT EXISTS public.engagement_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_program_id UUID NOT NULL REFERENCES public.engagement_programs(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.audit_procedures(id),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  procedure_name TEXT NOT NULL,
  instructions JSONB, -- Can be customized from template
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, in_review, complete, not_applicable
  priority TEXT DEFAULT 'medium', -- high, medium, low
  dependencies JSONB DEFAULT '[]'::jsonb, -- Array of procedure IDs
  workpaper_id UUID REFERENCES public.audit_workpapers(id),
  review_status TEXT DEFAULT 'pending_review', -- pending_review, reviewed, approved, requires_revision
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  evidence_collected JSONB DEFAULT '[]'::jsonb,
  exceptions_noted TEXT,
  conclusion TEXT,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Procedure Review Requirements (Quality control checkpoints)
CREATE TABLE IF NOT EXISTS public.procedure_review_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_procedure_id UUID NOT NULL REFERENCES public.engagement_procedures(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL, -- manager, partner, quality_reviewer
  required_reviewer_role TEXT,
  required_reviewer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, completed, waived
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_comments TEXT,
  sign_off_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Procedure Dependencies
CREATE TABLE IF NOT EXISTS public.procedure_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.audit_procedures(id) ON DELETE CASCADE,
  depends_on_procedure_id UUID NOT NULL REFERENCES public.audit_procedures(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'must_complete', -- must_complete, must_start, informational
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (procedure_id != depends_on_procedure_id)
);

-- Indexes for performance
CREATE INDEX idx_program_templates_firm ON public.audit_program_templates(firm_id);
CREATE INDEX idx_program_templates_type ON public.audit_program_templates(audit_type);
CREATE INDEX idx_procedures_firm ON public.audit_procedures(firm_id);
CREATE INDEX idx_procedures_code ON public.audit_procedures(procedure_code);
CREATE INDEX idx_procedures_category ON public.audit_procedures(category);
CREATE INDEX idx_program_procedures_template ON public.program_procedures(program_template_id);
CREATE INDEX idx_engagement_programs_engagement ON public.engagement_programs(engagement_id);
CREATE INDEX idx_engagement_procedures_engagement ON public.engagement_procedures(engagement_id);
CREATE INDEX idx_engagement_procedures_assigned ON public.engagement_procedures(assigned_to);
CREATE INDEX idx_engagement_procedures_status ON public.engagement_procedures(status);

-- Enable RLS
ALTER TABLE public.audit_program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_review_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_program_templates
CREATE POLICY "Firm members see templates"
  ON public.audit_program_templates FOR SELECT
  USING (
    firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    OR is_standard = true
  );

CREATE POLICY "Leaders manage templates"
  ON public.audit_program_templates FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- RLS Policies for audit_procedures
CREATE POLICY "Firm members see procedures"
  ON public.audit_procedures FOR SELECT
  USING (
    firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Leaders manage procedures"
  ON public.audit_procedures FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'practice_leader', 'engagement_manager')
    )
  );

-- RLS Policies for program_procedures
CREATE POLICY "Users see program procedures"
  ON public.program_procedures FOR SELECT
  USING (
    program_template_id IN (SELECT id FROM public.audit_program_templates)
  );

CREATE POLICY "Leaders manage program procedures"
  ON public.program_procedures FOR ALL
  USING (
    program_template_id IN (
      SELECT id FROM public.audit_program_templates
      WHERE firm_id IN (
        SELECT firm_id FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('firm_administrator', 'partner', 'practice_leader')
      )
    )
  );

-- RLS Policies for engagement_programs
CREATE POLICY "Users see engagement programs"
  ON public.engagement_programs FOR SELECT
  USING (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments WHERE user_id = auth.uid()
    )
    OR engagement_id IN (
      SELECT id FROM public.audits 
      WHERE firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Managers manage engagement programs"
  ON public.engagement_programs FOR ALL
  USING (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments 
      WHERE user_id = auth.uid() 
      AND role_on_engagement IN ('lead', 'manager')
    )
  );

-- RLS Policies for engagement_procedures
CREATE POLICY "Users see assigned procedures"
  ON public.engagement_procedures FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update their procedures"
  ON public.engagement_procedures FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments 
      WHERE user_id = auth.uid() 
      AND role_on_engagement IN ('lead', 'manager')
    )
  );

CREATE POLICY "Managers create procedures"
  ON public.engagement_procedures FOR INSERT
  WITH CHECK (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments 
      WHERE user_id = auth.uid() 
      AND role_on_engagement IN ('lead', 'manager')
    )
  );

CREATE POLICY "Managers delete procedures"
  ON public.engagement_procedures FOR DELETE
  USING (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments 
      WHERE user_id = auth.uid() 
      AND role_on_engagement IN ('lead', 'manager')
    )
  );

-- RLS Policies for procedure_review_requirements
CREATE POLICY "Users see review requirements"
  ON public.procedure_review_requirements FOR SELECT
  USING (
    engagement_procedure_id IN (SELECT id FROM public.engagement_procedures)
  );

CREATE POLICY "Reviewers manage requirements"
  ON public.procedure_review_requirements FOR ALL
  USING (
    required_reviewer_id = auth.uid()
    OR reviewed_by = auth.uid()
    OR engagement_procedure_id IN (
      SELECT id FROM public.engagement_procedures 
      WHERE engagement_id IN (
        SELECT engagement_id FROM public.engagement_assignments 
        WHERE user_id = auth.uid() 
        AND role_on_engagement IN ('lead', 'manager')
      )
    )
  );

-- RLS Policies for procedure_dependencies
CREATE POLICY "Users see dependencies"
  ON public.procedure_dependencies FOR SELECT
  USING (true);

CREATE POLICY "Leaders manage dependencies"
  ON public.procedure_dependencies FOR ALL
  USING (
    procedure_id IN (
      SELECT id FROM public.audit_procedures 
      WHERE firm_id IN (
        SELECT firm_id FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('firm_administrator', 'partner', 'practice_leader')
      )
    )
  );

-- Seed Standard SOC 2 Program Template
INSERT INTO public.audit_program_templates (
  firm_id,
  template_name,
  audit_type,
  industry,
  description,
  is_standard,
  is_active
)
SELECT 
  id as firm_id,
  'SOC 2 Type II - Standard Program',
  'SOC2',
  'Technology',
  'Comprehensive SOC 2 Type II audit program covering Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). Includes controls testing over a 12-month period.',
  true,
  true
FROM public.firms
LIMIT 1
ON CONFLICT DO NOTHING;

-- Seed Sample Procedures for SOC 2
INSERT INTO public.audit_procedures (firm_id, procedure_name, procedure_code, category, objective, instructions, estimated_hours, risk_level, control_objectives)
SELECT 
  f.id,
  'Access Control Policy Review',
  'AC-001',
  'control_test',
  'Verify that the organization has documented access control policies and procedures',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. Obtain the organization''s access control policy documentation"}]},{"type":"paragraph","content":[{"type":"text","text":"2. Review policy for completeness including user provisioning, de-provisioning, and review procedures"}]},{"type":"paragraph","content":[{"type":"text","text":"3. Verify policy is approved by management and dated"}]},{"type":"paragraph","content":[{"type":"text","text":"4. Document findings and any gaps identified"}]}]}'::jsonb,
  4,
  'high',
  '["CC6.1 - Logical Access Controls", "CC6.2 - Prior to Issuing Credentials"]'::jsonb
FROM public.firms f
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_procedures (firm_id, procedure_name, procedure_code, category, objective, instructions, estimated_hours, risk_level, control_objectives)
SELECT 
  f.id,
  'User Access Review Testing',
  'AC-002',
  'control_test',
  'Test that user access reviews are performed quarterly and access is appropriate',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. Select a sample of 25 users from the access review listing"}]},{"type":"paragraph","content":[{"type":"text","text":"2. For each user, verify their access rights match their job role"}]},{"type":"paragraph","content":[{"type":"text","text":"3. Confirm quarterly access reviews were performed by management"}]},{"type":"paragraph","content":[{"type":"text","text":"4. Test remediation of any access issues identified in reviews"}]},{"type":"paragraph","content":[{"type":"text","text":"5. Document any exceptions or inappropriate access"}]}]}'::jsonb,
  8,
  'high',
  '["CC6.1 - Logical Access Controls", "CC6.3 - Access Removal"]'::jsonb
FROM public.firms f
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_procedures (firm_id, procedure_name, procedure_code, category, objective, instructions, estimated_hours, risk_level, control_objectives)
SELECT 
  f.id,
  'Change Management Process Walkthrough',
  'CM-001',
  'walkthrough',
  'Understand and document the change management process',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. Interview IT management regarding change management procedures"}]},{"type":"paragraph","content":[{"type":"text","text":"2. Obtain change management policy and procedure documentation"}]},{"type":"paragraph","content":[{"type":"text","text":"3. Walk through the change ticketing system and approval workflow"}]},{"type":"paragraph","content":[{"type":"text","text":"4. Document key controls including approval, testing, and rollback procedures"}]},{"type":"paragraph","content":[{"type":"text","text":"5. Identify controls to be tested"}]}]}'::jsonb,
  6,
  'medium',
  '["CC8.1 - Change Management"]'::jsonb
FROM public.firms f
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_procedures (firm_id, procedure_name, procedure_code, category, objective, instructions, estimated_hours, risk_level, control_objectives)
SELECT 
  f.id,
  'Backup and Recovery Testing',
  'BC-001',
  'control_test',
  'Test that backups are performed and can be successfully restored',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. Obtain backup logs for the audit period"}]},{"type":"paragraph","content":[{"type":"text","text":"2. Select a sample of 20 backup instances throughout the year"}]},{"type":"paragraph","content":[{"type":"text","text":"3. Verify backups completed successfully"}]},{"type":"paragraph","content":[{"type":"text","text":"4. Test restoration of a recent backup to verify recoverability"}]},{"type":"paragraph","content":[{"type":"text","text":"5. Review backup failure alerts and remediation"}]}]}'::jsonb,
  10,
  'high',
  '["CC9.1 - Business Continuity", "A1.2 - Environmental Protections"]'::jsonb
FROM public.firms f
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_procedures (firm_id, procedure_name, procedure_code, category, objective, instructions, estimated_hours, risk_level, control_objectives)
SELECT 
  f.id,
  'Vulnerability Scanning Review',
  'SEC-001',
  'control_test',
  'Verify vulnerability scans are performed monthly and critical issues are remediated',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"1. Obtain vulnerability scan reports for each month in the audit period"}]},{"type":"paragraph","content":[{"type":"text","text":"2. Verify scans cover all in-scope systems"}]},{"type":"paragraph","content":[{"type":"text","text":"3. Review critical and high vulnerabilities identified"}]},{"type":"paragraph","content":[{"type":"text","text":"4. Test remediation timelines (Critical: 7 days, High: 30 days)"}]},{"type":"paragraph","content":[{"type":"text","text":"5. Document any overdue vulnerabilities"}]}]}'::jsonb,
  12,
  'high',
  '["CC7.1 - Detection of Security Events", "CC7.2 - Response to Security Events"]'::jsonb
FROM public.firms f
LIMIT 1
ON CONFLICT DO NOTHING;