-- Create engagement_resource_conflicts table
CREATE TABLE engagement_resource_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  conflict_start TIMESTAMPTZ NOT NULL,
  conflict_end TIMESTAMPTZ NOT NULL,
  conflict_type TEXT,
  conflicting_engagement_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  severity TEXT DEFAULT 'medium',
  resolution_status TEXT DEFAULT 'unresolved',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE engagement_resource_conflicts ENABLE ROW LEVEL SECURITY;

-- Firm members can view conflicts
CREATE POLICY "Firm members see engagement resource conflicts"
ON engagement_resource_conflicts
FOR SELECT
USING (
  firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  )
);

-- Managers can insert conflicts
CREATE POLICY "Managers create engagement resource conflicts"
ON engagement_resource_conflicts
FOR INSERT
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM profiles WHERE id = auth.uid()
  )
  AND engagement_id IN (
    SELECT engagement_id FROM engagement_assignments 
    WHERE user_id = auth.uid() 
    AND role_on_engagement IN ('lead', 'manager')
  )
);

-- Managers can update conflicts
CREATE POLICY "Managers update engagement resource conflicts"
ON engagement_resource_conflicts
FOR UPDATE
USING (
  engagement_id IN (
    SELECT engagement_id FROM engagement_assignments 
    WHERE user_id = auth.uid() 
    AND role_on_engagement IN ('lead', 'manager')
  )
);

-- Managers can delete conflicts
CREATE POLICY "Managers delete engagement resource conflicts"
ON engagement_resource_conflicts
FOR DELETE
USING (
  engagement_id IN (
    SELECT engagement_id FROM engagement_assignments 
    WHERE user_id = auth.uid() 
    AND role_on_engagement IN ('lead', 'manager')
  )
);

-- Create index for performance
CREATE INDEX idx_engagement_resource_conflicts_engagement ON engagement_resource_conflicts(engagement_id);
CREATE INDEX idx_engagement_resource_conflicts_user ON engagement_resource_conflicts(user_id);
CREATE INDEX idx_engagement_resource_conflicts_firm ON engagement_resource_conflicts(firm_id);