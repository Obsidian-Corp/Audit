-- Client Health Scores System
CREATE TABLE client_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  
  -- Score Components (0-100 each)
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  payment_score INTEGER DEFAULT 100 CHECK (payment_score >= 0 AND payment_score <= 100),
  satisfaction_score INTEGER DEFAULT 50 CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  communication_score INTEGER DEFAULT 50 CHECK (communication_score >= 0 AND communication_score <= 100),
  
  -- Overall Score (weighted average)
  overall_score INTEGER DEFAULT 50 CHECK (overall_score >= 0 AND overall_score <= 100),
  health_status TEXT DEFAULT 'good' CHECK (health_status IN ('excellent', 'good', 'fair', 'at-risk', 'critical')),
  
  -- Metadata
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  calculation_factors JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_scores_client ON client_health_scores(client_id);
CREATE INDEX idx_health_scores_status ON client_health_scores(health_status);
CREATE INDEX idx_health_scores_firm ON client_health_scores(firm_id);

-- RLS for client_health_scores
ALTER TABLE client_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see health scores"
  ON client_health_scores FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Staff manage health scores"
  ON client_health_scores FOR ALL
  USING (firm_id IN (
    SELECT firm_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['firm_administrator'::app_role, 'partner'::app_role, 'engagement_manager'::app_role])
  ));

-- Client Satisfaction Surveys
CREATE TABLE client_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  
  -- Survey Details
  survey_type TEXT NOT NULL CHECK (survey_type IN ('csat', 'nps', 'engagement_feedback')),
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Scores
  csat_score INTEGER CHECK (csat_score IS NULL OR (csat_score >= 1 AND csat_score <= 5)),
  nps_score INTEGER CHECK (nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10)),
  
  -- Feedback
  feedback_text TEXT,
  positive_aspects TEXT[],
  improvement_areas TEXT[],
  
  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_completed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  
  -- Tracking
  sent_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_satisfaction_client ON client_satisfaction_surveys(client_id);
CREATE INDEX idx_satisfaction_type ON client_satisfaction_surveys(survey_type);
CREATE INDEX idx_satisfaction_firm ON client_satisfaction_surveys(firm_id);

-- RLS for client_satisfaction_surveys
ALTER TABLE client_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see surveys"
  ON client_satisfaction_surveys FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Staff manage surveys"
  ON client_satisfaction_surveys FOR ALL
  USING (firm_id IN (
    SELECT firm_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['firm_administrator'::app_role, 'partner'::app_role, 'engagement_manager'::app_role, 'business_development'::app_role])
  ));

-- Client Acquisition Costs
CREATE TABLE client_acquisition_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  
  -- Cost Details
  cost_type TEXT NOT NULL CHECK (cost_type IN ('marketing', 'sales', 'travel', 'proposal', 'entertainment', 'other')),
  cost_amount DECIMAL NOT NULL CHECK (cost_amount >= 0),
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  
  -- Attribution
  attributed_to UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acquisition_costs_client ON client_acquisition_costs(client_id);
CREATE INDEX idx_acquisition_costs_opportunity ON client_acquisition_costs(opportunity_id);
CREATE INDEX idx_acquisition_costs_firm ON client_acquisition_costs(firm_id);

-- RLS for client_acquisition_costs
ALTER TABLE client_acquisition_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see acquisition costs"
  ON client_acquisition_costs FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Staff manage acquisition costs"
  ON client_acquisition_costs FOR ALL
  USING (firm_id IN (
    SELECT firm_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['firm_administrator'::app_role, 'partner'::app_role, 'business_development'::app_role])
  ));

-- Proposal Templates
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  
  -- Template Details
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN ('audit', 'tax', 'consulting', 'advisory', 'compliance', 'other')),
  description TEXT,
  
  -- Content
  template_content JSONB NOT NULL,
  variables JSONB DEFAULT '[]',
  default_sections JSONB DEFAULT '[]',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Tracking
  created_by UUID REFERENCES profiles(id),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposal_templates_firm ON proposal_templates(firm_id);
CREATE INDEX idx_proposal_templates_category ON proposal_templates(template_category);

-- RLS for proposal_templates
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see templates"
  ON proposal_templates FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ) AND is_active = true);

CREATE POLICY "Staff manage templates"
  ON proposal_templates FOR ALL
  USING (firm_id IN (
    SELECT firm_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['firm_administrator'::app_role, 'partner'::app_role, 'engagement_manager'::app_role])
  ));

-- Upsell Opportunities
CREATE TABLE upsell_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Opportunity Details
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('upsell', 'cross-sell', 'renewal_expansion')),
  service_suggested TEXT NOT NULL,
  estimated_value DECIMAL CHECK (estimated_value IS NULL OR estimated_value >= 0),
  
  -- Identification
  identified_by TEXT NOT NULL CHECK (identified_by IN ('manual', 'ai_suggestion', 'pattern_detection')),
  identification_reason TEXT,
  confidence_score INTEGER CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  
  -- Status
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'contacted', 'proposal_sent', 'won', 'lost', 'dismissed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Tracking
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_upsell_client ON upsell_opportunities(client_id);
CREATE INDEX idx_upsell_status ON upsell_opportunities(status);
CREATE INDEX idx_upsell_firm ON upsell_opportunities(firm_id);

-- RLS for upsell_opportunities
ALTER TABLE upsell_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see upsell opportunities"
  ON upsell_opportunities FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Staff manage upsell opportunities"
  ON upsell_opportunities FOR ALL
  USING (firm_id IN (
    SELECT firm_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['firm_administrator'::app_role, 'partner'::app_role, 'engagement_manager'::app_role, 'business_development'::app_role])
  ));

-- Client Portal Activity
CREATE TABLE client_portal_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'document_view', 'document_download', 'message_sent', 'report_access')),
  resource_type TEXT,
  resource_id UUID,
  
  -- Metadata
  activity_metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_activity_client ON client_portal_activity(client_id);
CREATE INDEX idx_portal_activity_type ON client_portal_activity(activity_type);
CREATE INDEX idx_portal_activity_user ON client_portal_activity(user_id);
CREATE INDEX idx_portal_activity_firm ON client_portal_activity(firm_id);

-- RLS for client_portal_activity
ALTER TABLE client_portal_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see portal activity"
  ON client_portal_activity FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "System creates portal activity"
  ON client_portal_activity FOR INSERT
  WITH CHECK (true);

-- Add renewal date tracking to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS renewal_likelihood TEXT CHECK (renewal_likelihood IN ('high', 'medium', 'low', 'at-risk'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_engagement_date DATE;