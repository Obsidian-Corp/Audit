-- Teams table for organizing audit staff
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  team_type TEXT NOT NULL DEFAULT 'audit', -- audit, compliance, risk, finance
  manager_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members junction table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- lead, senior, member
  specialization TEXT, -- financial, it, operational, compliance
  allocation_percentage INTEGER DEFAULT 100, -- % of time allocated to team
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Org members can view teams"
ON public.teams FOR SELECT
TO authenticated
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage teams"
ON public.teams FOR ALL
TO authenticated
USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- RLS Policies for team members
CREATE POLICY "Org members can view team members"
ON public.team_members FOR SELECT
TO authenticated
USING (team_id IN (
  SELECT id FROM public.teams WHERE is_org_member(auth.uid(), organization_id)
));

CREATE POLICY "Org admins and team leads can manage team members"
ON public.team_members FOR ALL
TO authenticated
USING (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE has_role(auth.uid(), t.organization_id, 'org_admin'::app_role)
    OR t.manager_id = auth.uid()
  )
)
WITH CHECK (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE has_role(auth.uid(), t.organization_id, 'org_admin'::app_role)
    OR t.manager_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_teams_organization ON public.teams(organization_id);
CREATE INDEX idx_teams_manager ON public.teams(manager_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);

-- Update timestamp trigger for teams
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();