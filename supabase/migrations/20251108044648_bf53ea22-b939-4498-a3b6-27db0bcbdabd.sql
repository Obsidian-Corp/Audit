-- Phase 1: Compliance & Policy Framework
CREATE TABLE IF NOT EXISTS platform_admin.policy_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('access_control', 'data_retention', 'data_residency', 'compliance', 'security')),
  description TEXT,
  policy_config JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_admin.policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES platform_admin.policy_definitions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  violation_details JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS platform_admin.compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_name TEXT NOT NULL UNIQUE,
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_admin.compliance_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES platform_admin.compliance_frameworks(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES platform_admin.policy_definitions(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(framework_id, policy_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS platform_admin.data_residency_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  allowed_regions TEXT[] NOT NULL,
  enforcement_level TEXT NOT NULL DEFAULT 'strict' CHECK (enforcement_level IN ('advisory', 'strict', 'blocking')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 2: Predictive Analytics
CREATE TABLE IF NOT EXISTS platform_admin.ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn', 'anomaly', 'capacity', 'cost_forecast')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  prediction_score NUMERIC(5,4) NOT NULL CHECK (prediction_score >= 0 AND prediction_score <= 1),
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  features JSONB NOT NULL DEFAULT '{}',
  prediction_details JSONB NOT NULL DEFAULT '{}',
  predicted_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  actual_outcome TEXT,
  outcome_recorded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS platform_admin.ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL,
  model_version TEXT NOT NULL,
  accuracy NUMERIC(5,4),
  precision NUMERIC(5,4),
  recall NUMERIC(5,4),
  f1_score NUMERIC(5,4),
  training_date TIMESTAMPTZ,
  evaluation_date TIMESTAMPTZ DEFAULT now(),
  metrics_data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS platform_admin.anomaly_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  pattern_signature JSONB NOT NULL,
  detection_count INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  severity_distribution JSONB DEFAULT '{"low": 0, "medium": 0, "high": 0, "critical": 0}'
);

-- Phase 3: Ontology & Data Catalog
CREATE TABLE IF NOT EXISTS platform_admin.data_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('table', 'view', 'function', 'schema', 'bucket', 'api')),
  schema_name TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  owner_id UUID REFERENCES auth.users(id),
  steward_id UUID REFERENCES auth.users(id),
  data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted', 'highly_restricted')),
  pii_contains BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_admin.data_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID REFERENCES platform_admin.data_entities(id) ON DELETE CASCADE,
  target_entity_id UUID REFERENCES platform_admin.data_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('references', 'derived_from', 'aggregates', 'joins', 'contains', 'uses')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_entity_id, target_entity_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS platform_admin.data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES platform_admin.data_entities(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completeness_score NUMERIC(5,4),
  accuracy_score NUMERIC(5,4),
  consistency_score NUMERIC(5,4),
  timeliness_score NUMERIC(5,4),
  overall_score NUMERIC(5,4),
  issues_detected INTEGER DEFAULT 0,
  metrics_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, metric_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_violations_org ON platform_admin.policy_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON platform_admin.policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_org ON platform_admin.ml_predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_type ON platform_admin.ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_data_entities_org ON platform_admin.data_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_relationships_source ON platform_admin.data_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_data_relationships_target ON platform_admin.data_relationships(target_entity_id);

-- RLS Policies
ALTER TABLE platform_admin.policy_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.data_residency_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.ml_model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.data_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.data_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.data_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage policies" ON platform_admin.policy_definitions
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view violations" ON platform_admin.policy_violations
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage frameworks" ON platform_admin.compliance_frameworks
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage residency rules" ON platform_admin.data_residency_rules
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view predictions" ON platform_admin.ml_predictions
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view model metrics" ON platform_admin.ml_model_metrics
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage data entities" ON platform_admin.data_entities
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage relationships" ON platform_admin.data_relationships
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view quality metrics" ON platform_admin.data_quality_metrics
  FOR ALL USING (is_platform_admin(auth.uid()));

-- Insert default compliance frameworks
INSERT INTO platform_admin.compliance_frameworks (framework_name, description, requirements) VALUES
('SOC2', 'SOC 2 Type II Compliance', '[
  {"id": "CC1.1", "category": "Control Environment", "requirement": "Integrity and ethical values"},
  {"id": "CC6.1", "category": "Logical Access", "requirement": "Access controls"},
  {"id": "CC7.2", "category": "System Operations", "requirement": "System monitoring"}
]'::jsonb),
('ISO27001', 'ISO/IEC 27001 Information Security', '[
  {"id": "A.9.1", "category": "Access Control", "requirement": "Access control policy"},
  {"id": "A.12.1", "category": "Operations Security", "requirement": "Operational procedures"},
  {"id": "A.18.1", "category": "Compliance", "requirement": "Legal requirements"}
]'::jsonb),
('GDPR', 'General Data Protection Regulation', '[
  {"id": "Art.5", "category": "Principles", "requirement": "Lawfulness, fairness and transparency"},
  {"id": "Art.25", "category": "Security", "requirement": "Data protection by design"},
  {"id": "Art.32", "category": "Security", "requirement": "Security of processing"}
]'::jsonb),
('HIPAA', 'Health Insurance Portability and Accountability Act', '[
  {"id": "164.308", "category": "Administrative", "requirement": "Security management process"},
  {"id": "164.312", "category": "Technical", "requirement": "Access controls"},
  {"id": "164.316", "category": "Policies", "requirement": "Documentation"}
]'::jsonb)
ON CONFLICT (framework_name) DO NOTHING;