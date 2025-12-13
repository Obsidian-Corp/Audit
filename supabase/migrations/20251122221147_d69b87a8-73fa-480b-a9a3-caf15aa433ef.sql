-- PHASE 1: CRM Integration - Link opportunities to engagements
ALTER TABLE audits ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS converted_to_engagement_id UUID REFERENCES audits(id);

CREATE INDEX IF NOT EXISTS idx_audits_opportunity_id ON audits(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_converted_to_engagement ON opportunities(converted_to_engagement_id);

-- PHASE 2: Communications, Deliverables, and Documents
CREATE TABLE engagement_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  communication_type TEXT NOT NULL CHECK (communication_type IN ('meeting', 'email', 'phone_call', 'status_update', 'decision')),
  subject TEXT NOT NULL,
  summary TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  communication_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  attachments JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  decisions_made JSONB DEFAULT '[]'::jsonb,
  next_steps TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE engagement_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  deliverable_name TEXT NOT NULL,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('report', 'letter', 'presentation', 'workpaper', 'recommendation', 'other')),
  description TEXT,
  due_date DATE NOT NULL,
  delivered_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'delivered', 'accepted', 'rejected')),
  assigned_to UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  client_accepted_by TEXT,
  client_accepted_at TIMESTAMPTZ,
  rejection_reason TEXT,
  file_url TEXT,
  version INTEGER DEFAULT 1,
  parent_deliverable_id UUID REFERENCES engagement_deliverables(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE engagement_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  document_name TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('contract', 'proposal', 'scope', 'correspondence', 'workpaper', 'supporting', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_client_visible BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES engagement_documents(id)
);

-- PHASE 3: Engagement Letter Generation
CREATE TABLE engagement_letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id),
  template_name TEXT NOT NULL,
  engagement_type TEXT,
  template_content TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE engagement_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  template_id UUID REFERENCES engagement_letter_templates(id),
  letter_content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'sent', 'signed')),
  generated_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PHASE 4: Calendar Integration
CREATE TABLE engagement_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('fieldwork', 'meeting', 'deadline', 'milestone', 'travel')),
  event_title TEXT NOT NULL,
  event_description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  milestone_id UUID,
  external_calendar_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  sync_error TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PHASE 5: Advanced Budget Features
CREATE TABLE engagement_budget_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  forecast_date DATE NOT NULL,
  forecast_method TEXT CHECK (forecast_method IN ('linear', 'earned_value', 'manual')),
  percent_complete NUMERIC(5,2),
  actual_hours_to_date INTEGER,
  actual_cost_to_date NUMERIC(12,2),
  estimated_hours_to_complete INTEGER,
  estimated_cost_to_complete NUMERIC(12,2),
  forecast_total_hours INTEGER,
  forecast_total_cost NUMERIC(12,2),
  variance_hours INTEGER,
  variance_cost NUMERIC(12,2),
  variance_percent NUMERIC(5,2),
  confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
  assumptions TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE budget_variance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  variance_date DATE NOT NULL,
  variance_type TEXT NOT NULL CHECK (variance_type IN ('hours', 'cost', 'scope')),
  budgeted_amount NUMERIC(12,2),
  actual_amount NUMERIC(12,2),
  variance_amount NUMERIC(12,2),
  variance_percent NUMERIC(5,2),
  variance_category TEXT CHECK (variance_category IN ('staffing', 'scope_change', 'efficiency', 'rate')),
  explanation TEXT,
  corrective_action TEXT,
  action_owner UUID REFERENCES profiles(id),
  action_due_date DATE,
  action_status TEXT DEFAULT 'planned' CHECK (action_status IN ('planned', 'in_progress', 'completed')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE burn_rate_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id),
  snapshot_date DATE NOT NULL,
  hours_spent INTEGER,
  cost_spent NUMERIC(12,2),
  days_elapsed INTEGER,
  daily_burn_rate_hours NUMERIC(8,2),
  daily_burn_rate_cost NUMERIC(10,2),
  projected_completion_date DATE,
  projected_total_hours INTEGER,
  projected_total_cost NUMERIC(12,2),
  burn_rate_status TEXT CHECK (burn_rate_status IN ('under', 'on_track', 'over', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_engagement_communications_engagement ON engagement_communications(engagement_id);
CREATE INDEX idx_engagement_communications_date ON engagement_communications(communication_date DESC);
CREATE INDEX idx_engagement_deliverables_engagement ON engagement_deliverables(engagement_id);
CREATE INDEX idx_engagement_deliverables_due_date ON engagement_deliverables(due_date);
CREATE INDEX idx_engagement_documents_engagement ON engagement_documents(engagement_id);
CREATE INDEX idx_engagement_letters_engagement ON engagement_letters(engagement_id);
CREATE INDEX idx_calendar_events_engagement ON engagement_calendar_events(engagement_id);
CREATE INDEX idx_calendar_events_dates ON engagement_calendar_events(start_date, end_date);
CREATE INDEX idx_budget_forecasts_engagement ON engagement_budget_forecasts(engagement_id);
CREATE INDEX idx_variance_logs_engagement ON budget_variance_logs(engagement_id);
CREATE INDEX idx_burn_rate_engagement ON burn_rate_snapshots(engagement_id);

-- Enable RLS
ALTER TABLE engagement_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_budget_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_variance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE burn_rate_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Communications
CREATE POLICY "Firm members see engagement communications" ON engagement_communications
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team members manage communications" ON engagement_communications
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid()
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- RLS Policies for Deliverables
CREATE POLICY "Firm members see deliverables" ON engagement_deliverables
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team members manage deliverables" ON engagement_deliverables
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid()
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- RLS Policies for Documents
CREATE POLICY "Firm members see documents" ON engagement_documents
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team members manage documents" ON engagement_documents
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid()
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- RLS Policies for Letter Templates
CREATE POLICY "Firm members see letter templates" ON engagement_letter_templates
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins manage letter templates" ON engagement_letter_templates
  FOR ALL USING (
    firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner')
    )
  );

-- RLS Policies for Engagement Letters
CREATE POLICY "Team members see letters" ON engagement_letters
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team members manage letters" ON engagement_letters
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid()
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- RLS Policies for Calendar Events
CREATE POLICY "Firm members see calendar events" ON engagement_calendar_events
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team members manage calendar events" ON engagement_calendar_events
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid()
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader')
    )
  );

-- RLS Policies for Budget Features
CREATE POLICY "Team members see budget data" ON engagement_budget_forecasts
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers manage forecasts" ON engagement_budget_forecasts
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments 
      WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager')
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner')
    )
  );

CREATE POLICY "Team members see variance logs" ON budget_variance_logs
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers manage variance logs" ON budget_variance_logs
  FOR ALL USING (
    engagement_id IN (
      SELECT engagement_id FROM engagement_assignments 
      WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager')
    ) OR firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner')
    )
  );

CREATE POLICY "Firm members see burn rate" ON burn_rate_snapshots
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "System creates burn rate snapshots" ON burn_rate_snapshots
  FOR INSERT WITH CHECK (true);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_engagement_communications_updated_at BEFORE UPDATE ON engagement_communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_deliverables_updated_at BEFORE UPDATE ON engagement_deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_letter_templates_updated_at BEFORE UPDATE ON engagement_letter_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_letters_updated_at BEFORE UPDATE ON engagement_letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON engagement_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();