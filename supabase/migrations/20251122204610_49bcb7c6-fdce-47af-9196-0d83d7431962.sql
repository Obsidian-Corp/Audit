-- CRM Module: Clients, Contacts, Opportunities, Meetings, Documents

-- CLIENTS table (your firm's customers)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  
  -- Company Information
  client_name TEXT NOT NULL,
  client_code TEXT,
  industry TEXT,
  company_size TEXT,
  website TEXT,
  
  -- Status & Classification
  status TEXT NOT NULL DEFAULT 'active',
  client_type TEXT,
  risk_rating TEXT,
  retention_status TEXT,
  
  -- Financial
  annual_revenue DECIMAL,
  contract_value DECIMAL,
  billing_preferences JSONB DEFAULT '{}',
  
  -- Relationship
  relationship_manager_id UUID REFERENCES profiles(id),
  account_manager_id UUID REFERENCES profiles(id),
  
  -- Hierarchy
  parent_client_id UUID REFERENCES clients(id),
  
  -- Key Dates
  client_since DATE,
  last_engagement_date DATE,
  next_renewal_date DATE,
  
  -- Tracking
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONTACTS table (people at client companies)
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  
  -- Contact Details
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  -- Relationship
  is_primary BOOLEAN DEFAULT false,
  is_decision_maker BOOLEAN DEFAULT false,
  relationship_strength TEXT,
  communication_preference TEXT,
  
  -- Special Dates
  birthday DATE,
  work_anniversary DATE,
  
  -- Tracking
  notes TEXT,
  last_contact_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OPPORTUNITIES table (sales pipeline)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  
  -- Opportunity Details
  opportunity_name TEXT NOT NULL,
  opportunity_type TEXT,
  description TEXT,
  
  -- Pipeline Stage
  stage TEXT NOT NULL DEFAULT 'lead',
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Financial
  estimated_value DECIMAL,
  probability INTEGER,
  expected_close_date DATE,
  
  -- Ownership
  owner_id UUID REFERENCES profiles(id),
  
  -- Win/Loss Tracking
  won_date DATE,
  lost_date DATE,
  lost_reason TEXT,
  competitor TEXT,
  
  -- Proposal
  proposal_sent_date DATE,
  proposal_document_url TEXT,
  
  -- Tracking
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLIENT_MEETINGS table (interaction tracking)
CREATE TABLE client_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id),
  
  -- Meeting Details
  meeting_title TEXT NOT NULL,
  meeting_type TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  
  -- Attendees
  internal_attendees UUID[],
  client_attendees TEXT[],
  
  -- Content
  agenda TEXT,
  notes TEXT,
  outcomes TEXT,
  follow_up_items JSONB DEFAULT '[]',
  
  -- Tracking
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLIENT_DOCUMENTS table (shared files with clients)
CREATE TABLE client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Document Details
  document_name TEXT NOT NULL,
  document_type TEXT,
  storage_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Access Control
  is_shared_with_client BOOLEAN DEFAULT false,
  shared_date DATE,
  
  -- Tracking
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link audits to clients
ALTER TABLE audits ADD COLUMN client_id UUID REFERENCES clients(id);

-- Indexes for performance
CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_relationship_manager ON clients(relationship_manager_id);
CREATE INDEX idx_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_opportunities_firm_id ON opportunities(firm_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_meetings_client_id ON client_meetings(client_id);
CREATE INDEX idx_documents_client_id ON client_documents(client_id);
CREATE INDEX idx_audits_client_id ON audits(client_id);

-- RLS Policies for CLIENTS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see clients"
  ON clients FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Leaders manage clients"
  ON clients FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'business_development', 'practice_leader')
    )
  );

-- RLS Policies for CLIENT_CONTACTS
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see contacts"
  ON client_contacts FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Leaders manage contacts"
  ON client_contacts FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE firm_id IN (
        SELECT firm_id FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('firm_administrator', 'partner', 'business_development', 'practice_leader', 'engagement_manager')
      )
    )
  );

-- RLS Policies for OPPORTUNITIES
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see opportunities"
  ON opportunities FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Leaders manage opportunities"
  ON opportunities FOR ALL
  USING (
    firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'business_development', 'practice_leader')
    )
  );

-- RLS Policies for CLIENT_MEETINGS
ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see meetings"
  ON client_meetings FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Team members manage meetings"
  ON client_meetings FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE firm_id IN (
        SELECT firm_id FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('firm_administrator', 'partner', 'business_development', 'practice_leader', 'engagement_manager')
      )
    )
  );

-- RLS Policies for CLIENT_DOCUMENTS
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see documents"
  ON client_documents FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Team members manage documents"
  ON client_documents FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE firm_id IN (
        SELECT firm_id FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('firm_administrator', 'partner', 'business_development', 'practice_leader', 'engagement_manager')
      )
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON client_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_meetings_updated_at BEFORE UPDATE ON client_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();