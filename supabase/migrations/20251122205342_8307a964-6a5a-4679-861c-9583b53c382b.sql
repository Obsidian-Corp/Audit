-- Create proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  proposal_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  template_used TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_date DATE,
  viewed_date DATE,
  view_count INTEGER DEFAULT 0,
  decision_date DATE,
  document_url TEXT,
  estimated_value DECIMAL(15,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_proposals_firm_id ON proposals(firm_id);
CREATE INDEX idx_proposals_opportunity_id ON proposals(opportunity_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- RLS policies
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm members see firm proposals"
  ON proposals FOR SELECT
  USING (firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users create proposals"
  ON proposals FOR INSERT
  WITH CHECK (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Users update proposals"
  ON proposals FOR UPDATE
  USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers delete proposals"
  ON proposals FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('firm_administrator', 'partner', 'engagement_manager')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add shared_with_client column to client_documents if not exists
ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS shared_with_client BOOLEAN DEFAULT false;