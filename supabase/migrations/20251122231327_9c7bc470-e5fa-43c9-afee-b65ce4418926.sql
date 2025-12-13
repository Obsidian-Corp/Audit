-- Create workpaper templates table
CREATE TABLE IF NOT EXISTS public.workpaper_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  workpaper_type TEXT NOT NULL,
  description TEXT,
  content JSON DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::json,
  is_standard BOOLEAN DEFAULT false,
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workpaper collaboration presence table
CREATE TABLE IF NOT EXISTS public.workpaper_collaboration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES public.audit_workpapers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  color TEXT NOT NULL,
  cursor_position INTEGER,
  selection_start INTEGER,
  selection_end INTEGER,
  last_seen TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workpaper_id, user_id)
);

-- Add template_id to audit_workpapers
ALTER TABLE public.audit_workpapers 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.workpaper_templates(id),
ADD COLUMN IF NOT EXISTS procedure_id UUID REFERENCES public.engagement_procedures(id);

-- Create workpaper review comments table
CREATE TABLE IF NOT EXISTS public.workpaper_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workpaper_id UUID NOT NULL REFERENCES public.audit_workpapers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  position INTEGER,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workpaper_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workpaper_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workpaper_review_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workpaper_templates
CREATE POLICY "Users can view templates in their firm"
  ON public.workpaper_templates FOR SELECT
  USING (is_firm_member(auth.uid(), firm_id));

CREATE POLICY "Users can create templates in their firm"
  ON public.workpaper_templates FOR INSERT
  WITH CHECK (is_firm_member(auth.uid(), firm_id));

CREATE POLICY "Users can update templates in their firm"
  ON public.workpaper_templates FOR UPDATE
  USING (is_firm_member(auth.uid(), firm_id));

CREATE POLICY "Users can delete templates in their firm"
  ON public.workpaper_templates FOR DELETE
  USING (is_firm_member(auth.uid(), firm_id));

-- RLS Policies for workpaper_collaboration
CREATE POLICY "Users can view collaboration in their firm"
  ON public.workpaper_collaboration FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_workpapers w
      WHERE w.id = workpaper_id AND is_firm_member(auth.uid(), w.firm_id)
    )
  );

CREATE POLICY "Users can insert collaboration in their firm"
  ON public.workpaper_collaboration FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audit_workpapers w
      WHERE w.id = workpaper_id AND is_firm_member(auth.uid(), w.firm_id)
    )
  );

CREATE POLICY "Users can update their own collaboration"
  ON public.workpaper_collaboration FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own collaboration"
  ON public.workpaper_collaboration FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for workpaper_review_comments
CREATE POLICY "Users can view comments in their firm"
  ON public.workpaper_review_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audit_workpapers w
      WHERE w.id = workpaper_id AND is_firm_member(auth.uid(), w.firm_id)
    )
  );

CREATE POLICY "Users can create comments in their firm"
  ON public.workpaper_review_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audit_workpapers w
      WHERE w.id = workpaper_id AND is_firm_member(auth.uid(), w.firm_id)
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.workpaper_review_comments FOR UPDATE
  USING (user_id = auth.uid());

-- Enable realtime for collaboration (audit_workpapers already has realtime enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.workpaper_collaboration;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workpaper_templates_firm ON public.workpaper_templates(firm_id);
CREATE INDEX IF NOT EXISTS idx_workpaper_collaboration_workpaper ON public.workpaper_collaboration(workpaper_id);
CREATE INDEX IF NOT EXISTS idx_workpaper_review_comments_workpaper ON public.workpaper_review_comments(workpaper_id);
CREATE INDEX IF NOT EXISTS idx_audit_workpapers_procedure ON public.audit_workpapers(procedure_id);

-- Seed some standard workpaper templates
INSERT INTO public.workpaper_templates (firm_id, template_name, workpaper_type, description, category, is_standard, content)
SELECT 
  f.id,
  'Access Control Testing',
  'testing',
  'Template for documenting access control testing procedures',
  'Security',
  true,
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Access Control Testing Workpaper"}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Objective"}]},{"type":"paragraph","content":[{"type":"text","text":"Document testing of access controls and user permissions."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Scope"}]},{"type":"paragraph"},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Testing Procedures"}]},{"type":"paragraph"},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Results"}]},{"type":"paragraph"},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Conclusion"}]},{"type":"paragraph"}]}'::json
FROM public.firms f
LIMIT 1
ON CONFLICT DO NOTHING;