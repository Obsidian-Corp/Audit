-- Migration: Risk Assessment Tables
-- Purpose: Enable risk-based audit methodology with structured risk assessment
-- Phase: 1 (Foundation)
-- Date: 2025-11-30

-- ============================================================================
-- 1. ENGAGEMENT RISK ASSESSMENTS
-- ============================================================================
-- Stores overall risk assessment for each engagement
CREATE TABLE IF NOT EXISTS public.engagement_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Business Understanding
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL CHECK (company_size IN ('small', 'medium', 'large', 'enterprise')),
  revenue_range TEXT,
  complexity_factors JSONB DEFAULT '[]'::jsonb,

  -- Engagement Context
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('first_year', 'recurring', 'special_purpose')),
  prior_year_opinion TEXT CHECK (prior_year_opinion IN ('clean', 'qualified', 'adverse', 'disclaimer', 'n/a')),
  years_as_client INTEGER DEFAULT 0 CHECK (years_as_client >= 0),

  -- Overall Risk Ratings
  overall_risk_rating TEXT NOT NULL CHECK (overall_risk_rating IN ('low', 'medium', 'high', 'significant')),
  fraud_risk_rating TEXT NOT NULL CHECK (fraud_risk_rating IN ('low', 'medium', 'high', 'significant')),
  it_dependency_rating TEXT NOT NULL CHECK (it_dependency_rating IN ('low', 'medium', 'high', 'significant')),

  -- Assessment Metadata
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  review_status TEXT DEFAULT 'draft' CHECK (review_status IN ('draft', 'reviewed', 'approved')),

  -- Audit Trail
  version INTEGER DEFAULT 1 CHECK (version > 0),
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_engagement_version UNIQUE(engagement_id, version),
  CONSTRAINT one_current_assessment_per_engagement UNIQUE NULLS NOT DISTINCT (engagement_id, is_current)
    DEFERRABLE INITIALLY DEFERRED
);

-- Add helpful comments
COMMENT ON TABLE public.engagement_risk_assessments IS
  'Overall risk assessment for each engagement, driving procedure selection and sample sizes';
COMMENT ON COLUMN public.engagement_risk_assessments.complexity_factors IS
  'Array of complexity factors (e.g., multi-entity, international, complex instruments) as JSONB';
COMMENT ON COLUMN public.engagement_risk_assessments.is_current IS
  'Only one assessment can be current per engagement at a time';

-- ============================================================================
-- 2. RISK ASSESSMENT AREAS
-- ============================================================================
-- Individual risk scores for each financial statement area or audit focus area
CREATE TABLE IF NOT EXISTS public.risk_assessment_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_assessment_id UUID NOT NULL REFERENCES public.engagement_risk_assessments(id) ON DELETE CASCADE,

  -- Area Identification
  area_name TEXT NOT NULL,
  area_category TEXT NOT NULL CHECK (area_category IN ('balance_sheet', 'income_statement', 'control_environment', 'other')),

  -- Risk Scoring
  inherent_risk TEXT NOT NULL CHECK (inherent_risk IN ('low', 'medium', 'high', 'significant')),
  control_risk TEXT NOT NULL CHECK (control_risk IN ('low', 'medium', 'high', 'significant')),
  combined_risk TEXT NOT NULL CHECK (combined_risk IN ('low', 'medium', 'high', 'significant')),
  fraud_risk_factors JSONB DEFAULT '[]'::jsonb,

  -- Risk Justification
  risk_rationale TEXT,
  key_risk_factors JSONB DEFAULT '[]'::jsonb,

  -- Materiality Context
  materiality_threshold NUMERIC CHECK (materiality_threshold >= 0),
  is_material_area BOOLEAN DEFAULT true,

  -- Recommendations
  recommended_approach TEXT CHECK (recommended_approach IN ('substantive', 'controls_reliance', 'combined')),
  recommended_testing_level TEXT CHECK (recommended_testing_level IN ('minimal', 'standard', 'enhanced', 'extensive')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_area_per_assessment UNIQUE(risk_assessment_id, area_name)
);

COMMENT ON TABLE public.risk_assessment_areas IS
  'Individual risk ratings for each financial statement area (Cash, AR, Inventory, Revenue, etc.)';
COMMENT ON COLUMN public.risk_assessment_areas.combined_risk IS
  'Calculated from inherent_risk x control_risk using risk matrix';
COMMENT ON COLUMN public.risk_assessment_areas.fraud_risk_factors IS
  'Specific fraud risk indicators for this area as JSONB array';

-- ============================================================================
-- 3. RISK ASSESSMENT RESPONSES
-- ============================================================================
-- Individual questionnaire responses that inform risk scoring
CREATE TABLE IF NOT EXISTS public.risk_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_assessment_id UUID NOT NULL REFERENCES public.engagement_risk_assessments(id) ON DELETE CASCADE,

  -- Question Context
  question_category TEXT NOT NULL CHECK (question_category IN ('business', 'controls', 'fraud', 'it', 'industry', 'other')),
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,

  -- Response
  response_value TEXT,
  response_type TEXT NOT NULL CHECK (response_type IN ('boolean', 'text', 'numeric', 'multi_select', 'single_select')),
  risk_impact TEXT CHECK (risk_impact IN ('increases_risk', 'decreases_risk', 'neutral')),

  -- Metadata
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_response_per_question UNIQUE(risk_assessment_id, question_id)
);

COMMENT ON TABLE public.risk_assessment_responses IS
  'Individual questionnaire responses used to calculate risk scores';

-- ============================================================================
-- 4. RISK ASSESSMENT TEMPLATES
-- ============================================================================
-- Pre-configured questionnaires and risk frameworks by industry
CREATE TABLE IF NOT EXISTS public.risk_assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Template Identity
  template_name TEXT NOT NULL,
  template_code TEXT NOT NULL,
  industry TEXT, -- NULL means applies to all industries

  -- Template Configuration
  questionnaire JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_risk_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_matrix_config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  is_standard BOOLEAN DEFAULT false, -- true for system-provided templates
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_template_code UNIQUE(firm_id, template_code)
);

COMMENT ON TABLE public.risk_assessment_templates IS
  'Pre-configured risk assessment templates by industry (Healthcare, Financial Services, etc.)';
COMMENT ON COLUMN public.risk_assessment_templates.questionnaire IS
  'JSONB array of questions with scoring logic';
COMMENT ON COLUMN public.risk_assessment_templates.default_risk_areas IS
  'Default financial statement areas to assess for this industry';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Lookup assessments by engagement (most common query)
CREATE INDEX idx_risk_assessments_engagement
  ON public.engagement_risk_assessments(engagement_id);

-- Find current assessment quickly
CREATE INDEX idx_risk_assessments_current
  ON public.engagement_risk_assessments(engagement_id, is_current)
  WHERE is_current = true;

-- Firm-level analytics
CREATE INDEX idx_risk_assessments_firm
  ON public.engagement_risk_assessments(firm_id, overall_risk_rating);

-- Risk area queries
CREATE INDEX idx_risk_areas_assessment
  ON public.risk_assessment_areas(risk_assessment_id);

CREATE INDEX idx_risk_areas_combined_risk
  ON public.risk_assessment_areas(risk_assessment_id, combined_risk, is_material_area);

-- Response queries
CREATE INDEX idx_risk_responses_assessment
  ON public.risk_assessment_responses(risk_assessment_id);

-- Template lookups
CREATE INDEX idx_risk_templates_industry
  ON public.risk_assessment_templates(industry, is_active)
  WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.engagement_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessment_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessment_templates ENABLE ROW LEVEL SECURITY;

-- Risk Assessments: Firm members can access their firm's assessments
CREATE POLICY "Firm members access risk assessments"
  ON public.engagement_risk_assessments FOR ALL
  USING (
    firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- Risk Areas: Access through assessment
CREATE POLICY "Users access risk areas via assessment"
  ON public.risk_assessment_areas FOR ALL
  USING (
    risk_assessment_id IN (
      SELECT id FROM public.engagement_risk_assessments
      WHERE firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Responses: Access through assessment
CREATE POLICY "Users access responses via assessment"
  ON public.risk_assessment_responses FOR ALL
  USING (
    risk_assessment_id IN (
      SELECT id FROM public.engagement_risk_assessments
      WHERE firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Templates: Firm-specific + standard templates
CREATE POLICY "Firm members see templates"
  ON public.risk_assessment_templates FOR SELECT
  USING (
    is_standard = true
    OR firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Leaders manage custom templates"
  ON public.risk_assessment_templates FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_risk_assessment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on risk assessments
CREATE TRIGGER update_risk_assessments_timestamp
  BEFORE UPDATE ON public.engagement_risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_assessment_timestamp();

-- Trigger: Update timestamp on risk areas
CREATE TRIGGER update_risk_areas_timestamp
  BEFORE UPDATE ON public.risk_assessment_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_assessment_timestamp();

-- Function: Ensure only one current assessment per engagement
CREATE OR REPLACE FUNCTION ensure_one_current_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this assessment as current, mark others as not current
  IF NEW.is_current = true THEN
    UPDATE public.engagement_risk_assessments
    SET is_current = false
    WHERE engagement_id = NEW.engagement_id
      AND id != NEW.id
      AND is_current = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_current_assessment_trigger
  BEFORE INSERT OR UPDATE ON public.engagement_risk_assessments
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION ensure_one_current_assessment();

-- Function: Calculate combined risk from inherent and control risk
CREATE OR REPLACE FUNCTION calculate_combined_risk(
  inherent TEXT,
  control TEXT
)
RETURNS TEXT AS $$
BEGIN
  -- Risk matrix: inherent x control = combined
  -- Low x Low = Low, Medium x Low = Medium, etc.
  RETURN CASE
    WHEN inherent = 'low' AND control = 'low' THEN 'low'
    WHEN inherent = 'low' AND control = 'medium' THEN 'medium'
    WHEN inherent = 'low' AND control IN ('high', 'significant') THEN 'high'
    WHEN inherent = 'medium' AND control = 'low' THEN 'medium'
    WHEN inherent = 'medium' AND control = 'medium' THEN 'medium'
    WHEN inherent = 'medium' AND control = 'high' THEN 'high'
    WHEN inherent = 'medium' AND control = 'significant' THEN 'significant'
    WHEN inherent = 'high' AND control = 'low' THEN 'high'
    WHEN inherent = 'high' AND control = 'medium' THEN 'high'
    WHEN inherent = 'high' AND control IN ('high', 'significant') THEN 'significant'
    WHEN inherent = 'significant' THEN 'significant'
    ELSE 'medium' -- Default fallback
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_combined_risk IS
  'Calculates combined risk level from inherent and control risk using standard risk matrix';

-- ============================================================================
-- SEED DATA: Standard Risk Assessment Templates
-- ============================================================================

-- Template 1: Healthcare Industry Risk Assessment
INSERT INTO public.risk_assessment_templates (
  template_name,
  template_code,
  industry,
  questionnaire,
  default_risk_areas,
  is_standard
)
VALUES (
  'Healthcare Industry Risk Assessment',
  'HEALTHCARE_STANDARD',
  'healthcare',
  '[
    {
      "id": "hc_revenue_complexity",
      "category": "industry",
      "question": "Does the organization have multiple payer types (Medicare, Medicaid, Commercial)?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["revenue", "accounts_receivable"]
    },
    {
      "id": "hc_patient_volume",
      "category": "business",
      "question": "Annual patient volume",
      "type": "numeric",
      "risk_impact": "neutral"
    },
    {
      "id": "hc_hipaa_compliance",
      "category": "controls",
      "question": "Are HIPAA compliance controls tested annually?",
      "type": "boolean",
      "risk_impact": "decreases_risk",
      "affects_areas": ["control_environment"]
    }
  ]'::jsonb,
  '[
    {"name": "Cash", "category": "balance_sheet", "default_inherent": "low"},
    {"name": "Accounts Receivable", "category": "balance_sheet", "default_inherent": "high"},
    {"name": "Revenue", "category": "income_statement", "default_inherent": "high"},
    {"name": "Medical Supplies Inventory", "category": "balance_sheet", "default_inherent": "medium"},
    {"name": "Fixed Assets", "category": "balance_sheet", "default_inherent": "low"},
    {"name": "Operating Expenses", "category": "income_statement", "default_inherent": "medium"}
  ]'::jsonb,
  true
);

-- Template 2: Technology/SaaS Risk Assessment
INSERT INTO public.risk_assessment_templates (
  template_name,
  template_code,
  industry,
  questionnaire,
  default_risk_areas,
  is_standard
)
VALUES (
  'Technology/SaaS Industry Risk Assessment',
  'TECHNOLOGY_STANDARD',
  'technology',
  '[
    {
      "id": "tech_asc606",
      "category": "industry",
      "question": "Does revenue recognition involve complex ASC 606 considerations?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["revenue", "deferred_revenue"]
    },
    {
      "id": "tech_stock_comp",
      "category": "industry",
      "question": "Significant stock-based compensation expense?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["expenses", "equity"]
    },
    {
      "id": "tech_capitalized_dev",
      "category": "industry",
      "question": "Does the company capitalize development costs?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["fixed_assets", "expenses"]
    }
  ]'::jsonb,
  '[
    {"name": "Cash", "category": "balance_sheet", "default_inherent": "low"},
    {"name": "Accounts Receivable", "category": "balance_sheet", "default_inherent": "medium"},
    {"name": "Revenue", "category": "income_statement", "default_inherent": "high"},
    {"name": "Deferred Revenue", "category": "balance_sheet", "default_inherent": "high"},
    {"name": "Capitalized Development Costs", "category": "balance_sheet", "default_inherent": "high"},
    {"name": "Stock-Based Compensation", "category": "income_statement", "default_inherent": "medium"}
  ]'::jsonb,
  true
);

-- Template 3: General/Manufacturing Risk Assessment
INSERT INTO public.risk_assessment_templates (
  template_name,
  template_code,
  industry,
  questionnaire,
  default_risk_areas,
  is_standard
)
VALUES (
  'General Business Risk Assessment',
  'GENERAL_STANDARD',
  NULL, -- Applies to all industries
  '[
    {
      "id": "gen_first_year",
      "category": "business",
      "question": "Is this a first-year audit?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["all"]
    },
    {
      "id": "gen_going_concern",
      "category": "business",
      "question": "Are there going concern indicators?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["all"]
    },
    {
      "id": "gen_related_party",
      "category": "fraud",
      "question": "Significant related party transactions?",
      "type": "boolean",
      "risk_impact": "increases_risk",
      "affects_areas": ["revenue", "expenses", "receivables", "payables"]
    }
  ]'::jsonb,
  '[
    {"name": "Cash", "category": "balance_sheet", "default_inherent": "medium"},
    {"name": "Accounts Receivable", "category": "balance_sheet", "default_inherent": "medium"},
    {"name": "Inventory", "category": "balance_sheet", "default_inherent": "medium"},
    {"name": "Fixed Assets", "category": "balance_sheet", "default_inherent": "low"},
    {"name": "Accounts Payable", "category": "balance_sheet", "default_inherent": "low"},
    {"name": "Revenue", "category": "income_statement", "default_inherent": "medium"},
    {"name": "Cost of Goods Sold", "category": "income_statement", "default_inherent": "medium"},
    {"name": "Operating Expenses", "category": "income_statement", "default_inherent": "low"}
  ]'::jsonb,
  true
);

-- ============================================================================
-- GRANTS (if needed for specific roles)
-- ============================================================================

-- Grant access to authenticated users (RLS policies handle firm-level security)
GRANT SELECT, INSERT, UPDATE ON public.engagement_risk_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_assessment_areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_assessment_responses TO authenticated;
GRANT SELECT ON public.risk_assessment_templates TO authenticated;
GRANT INSERT, UPDATE ON public.risk_assessment_templates TO authenticated;
