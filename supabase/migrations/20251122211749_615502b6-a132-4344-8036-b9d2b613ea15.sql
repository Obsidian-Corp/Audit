-- Create engagement_milestones table
CREATE TABLE public.engagement_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_type TEXT NOT NULL, -- kickoff, fieldwork_start, interim_review, fieldwork_complete, draft_report, final_report, client_acceptance
  planned_date DATE NOT NULL,
  actual_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, overdue
  description TEXT,
  dependencies JSONB DEFAULT '[]'::jsonb,
  is_critical BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create engagement_scope table
CREATE TABLE public.engagement_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
  scope_boundaries TEXT,
  exclusions TEXT,
  key_risks TEXT[] DEFAULT ARRAY[]::TEXT[],
  materiality_threshold NUMERIC,
  sample_size INTEGER,
  testing_approach TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create engagement_change_orders table
CREATE TABLE public.engagement_change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  change_number TEXT NOT NULL,
  change_type TEXT NOT NULL, -- scope, budget, timeline, team
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  impact_hours INTEGER,
  impact_budget NUMERIC,
  impact_timeline_days INTEGER,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, approved, rejected, implemented
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create engagement_templates table
CREATE TABLE public.engagement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  engagement_type TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  default_scope JSONB DEFAULT '{}'::jsonb,
  default_milestones JSONB DEFAULT '[]'::jsonb,
  default_team_structure JSONB DEFAULT '[]'::jsonb,
  estimated_hours_by_role JSONB DEFAULT '{}'::jsonb,
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  deliverables_checklist TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhance audit_team_members table
ALTER TABLE public.audit_team_members
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_backup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
ADD COLUMN IF NOT EXISTS hours_logged NUMERIC DEFAULT 0;

-- Add engagement workflow columns to audits table
ALTER TABLE public.audits
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, active, fieldwork, reporting, review, complete, archived
ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approval_requested_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'fixed_fee', -- fixed_fee, time_and_materials, blended_rate
ADD COLUMN IF NOT EXISTS blended_rate NUMERIC,
ADD COLUMN IF NOT EXISTS contingency_percentage NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS burn_rate_warning_threshold NUMERIC DEFAULT 80;

-- Create indexes
CREATE INDEX idx_engagement_milestones_engagement ON public.engagement_milestones(engagement_id);
CREATE INDEX idx_engagement_milestones_status ON public.engagement_milestones(status);
CREATE INDEX idx_engagement_scope_engagement ON public.engagement_scope(engagement_id);
CREATE INDEX idx_engagement_change_orders_engagement ON public.engagement_change_orders(engagement_id);
CREATE INDEX idx_engagement_change_orders_status ON public.engagement_change_orders(status);
CREATE INDEX idx_engagement_templates_firm ON public.engagement_templates(firm_id);
CREATE INDEX idx_audit_team_members_dates ON public.audit_team_members(start_date, end_date);

-- Enable RLS
ALTER TABLE public.engagement_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for engagement_milestones
CREATE POLICY "Firm members view milestones"
  ON public.engagement_milestones FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team members manage milestones"
  ON public.engagement_milestones FOR ALL
  USING (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments WHERE user_id = auth.uid()
    ) OR
    firm_id IN (
      SELECT firm_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'engagement_manager')
    )
  );

-- RLS Policies for engagement_scope
CREATE POLICY "Firm members view scope"
  ON public.engagement_scope FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers manage scope"
  ON public.engagement_scope FOR ALL
  USING (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments 
      WHERE user_id = auth.uid() 
      AND role_on_engagement IN ('lead', 'manager')
    ) OR
    firm_id IN (
      SELECT firm_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner')
    )
  );

-- RLS Policies for engagement_change_orders
CREATE POLICY "Firm members view change orders"
  ON public.engagement_change_orders FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team members create change orders"
  ON public.engagement_change_orders FOR INSERT
  WITH CHECK (
    engagement_id IN (
      SELECT engagement_id FROM public.engagement_assignments WHERE user_id = auth.uid()
    ) AND
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers approve change orders"
  ON public.engagement_change_orders FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'engagement_manager')
    )
  );

-- RLS Policies for engagement_templates
CREATE POLICY "Firm members view templates"
  ON public.engagement_templates FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins manage templates"
  ON public.engagement_templates FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_engagement_milestones_updated_at
  BEFORE UPDATE ON public.engagement_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_scope_updated_at
  BEFORE UPDATE ON public.engagement_scope
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_change_orders_updated_at
  BEFORE UPDATE ON public.engagement_change_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_templates_updated_at
  BEFORE UPDATE ON public.engagement_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();