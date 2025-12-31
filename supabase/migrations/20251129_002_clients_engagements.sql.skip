-- ============================================================================
-- Migration: Clients & Engagements Tables
-- Version: 20251129_002
-- Description: Creates tables for client management and audit engagements
-- Dependencies: 20251129_001_core_platform_tables.sql
-- ============================================================================

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
-- Stores client information for audit firms
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  industry TEXT,
  entity_type TEXT CHECK (entity_type IN ('corporation', 'partnership', 'llc', 'nonprofit', 'government', 'other')),
  tax_id TEXT,
  fiscal_year_end TEXT,
  website TEXT,
  address JSONB DEFAULT '{
    "street": "",
    "city": "",
    "state": "",
    "zip": "",
    "country": "USA"
  }',
  contacts JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  risk_rating TEXT CHECK (risk_rating IN ('low', 'medium', 'high', 'very_high')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ENGAGEMENTS TABLE
-- ============================================================================
-- Stores audit engagement information
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN (
    'financial_audit',
    'review',
    'compilation',
    'agreed_upon_procedures',
    'tax_compliance',
    'internal_audit',
    'other'
  )),
  fiscal_year_end DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN (
    'planning',
    'fieldwork',
    'review',
    'reporting',
    'completed',
    'archived'
  )),
  risk_rating TEXT CHECK (risk_rating IN ('low', 'medium', 'high', 'very_high')),
  materiality_amount DECIMAL(15,2),
  start_date DATE,
  fieldwork_start DATE,
  fieldwork_end DATE,
  report_date DATE,
  budget_hours INTEGER CHECK (budget_hours >= 0),
  actual_hours INTEGER DEFAULT 0 CHECK (actual_hours >= 0),
  team_members JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{
    "require_preparer_signoff": true,
    "require_reviewer_signoff": true,
    "require_manager_signoff": true,
    "require_partner_signoff": true,
    "allow_concurrent_editing": true,
    "enable_ai_assistant": true
  }',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for engagements
CREATE INDEX IF NOT EXISTS idx_engagements_organization ON engagements(organization_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);
CREATE INDEX IF NOT EXISTS idx_engagements_dates ON engagements(start_date, report_date);
CREATE INDEX IF NOT EXISTS idx_engagements_type ON engagements(engagement_type);
CREATE INDEX IF NOT EXISTS idx_engagements_created_by ON engagements(created_by);

-- Enable RLS on engagements
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Clients Policies
-- -----------------------------------------------
-- Organization members can view clients
CREATE POLICY "Organization members can view clients"
  ON clients FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Organization members can insert clients
CREATE POLICY "Organization members can insert clients"
  ON clients FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner', 'manager')
  ));

-- Organization members can update clients
CREATE POLICY "Organization members can update clients"
  ON clients FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner', 'manager', 'senior')
  ));

-- Admins and partners can delete clients
CREATE POLICY "Admins and partners can delete clients"
  ON clients FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner')
  ));

-- Engagements Policies
-- -----------------------------------------------
-- Organization members can view engagements
CREATE POLICY "Organization members can view engagements"
  ON engagements FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Organization members can insert engagements
CREATE POLICY "Organization members can insert engagements"
  ON engagements FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner', 'manager')
  ));

-- Organization members can update engagements
CREATE POLICY "Organization members can update engagements"
  ON engagements FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner', 'manager', 'senior')
  ));

-- Admins and partners can delete engagements
CREATE POLICY "Admins and partners can delete engagements"
  ON engagements FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'partner')
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for clients updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for engagements updated_at
CREATE TRIGGER update_engagements_updated_at
  BEFORE UPDATE ON engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get engagement team members count
CREATE OR REPLACE FUNCTION get_engagement_team_count(engagement_id UUID)
RETURNS INTEGER AS $$
DECLARE
  team_count INTEGER;
BEGIN
  SELECT jsonb_array_length(team_members) INTO team_count
  FROM engagements
  WHERE id = engagement_id;

  RETURN COALESCE(team_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is on engagement team
CREATE OR REPLACE FUNCTION is_on_engagement_team(engagement_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM engagements e
    WHERE e.id = engagement_id
    AND e.team_members @> jsonb_build_array(jsonb_build_object('user_id', user_id))
  ) INTO is_member;

  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for engagement summary with client info
CREATE OR REPLACE VIEW engagement_summary AS
SELECT
  e.id,
  e.organization_id,
  e.name AS engagement_name,
  e.engagement_type,
  e.status,
  e.fiscal_year_end,
  e.materiality_amount,
  e.start_date,
  e.report_date,
  e.budget_hours,
  e.actual_hours,
  CASE
    WHEN e.budget_hours > 0
    THEN ROUND((e.actual_hours::DECIMAL / e.budget_hours::DECIMAL) * 100, 2)
    ELSE 0
  END AS budget_utilization_percent,
  c.id AS client_id,
  c.name AS client_name,
  c.industry AS client_industry,
  c.risk_rating AS client_risk_rating,
  e.created_at,
  e.updated_at
FROM engagements e
JOIN clients c ON e.client_id = c.id;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE clients IS 'Stores client information for audit organizations';
COMMENT ON TABLE engagements IS 'Stores audit engagement information';
COMMENT ON COLUMN clients.contacts IS 'JSON array of contact objects with name, email, phone, role';
COMMENT ON COLUMN clients.address IS 'JSON object containing complete address information';
COMMENT ON COLUMN engagements.team_members IS 'JSON array of team member objects with user_id, role, allocation';
COMMENT ON COLUMN engagements.settings IS 'JSON object containing engagement-specific settings and preferences';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_002_clients_engagements.sql completed successfully';
END $$;
