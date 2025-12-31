-- =====================================================================
-- MIGRATION: Create review_notes table
-- Ticket: DB-002
-- Purpose: Store review comments with threading, resolution workflow,
--          and priority levels for workpaper collaboration
-- =====================================================================

-- Create the review_notes table
CREATE TABLE IF NOT EXISTS public.review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  workpaper_id UUID NOT NULL REFERENCES public.audit_workpapers(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.audit_procedures(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Note content
  note_type VARCHAR(50) NOT NULL CHECK (note_type IN ('comment', 'question', 'issue', 'suggestion')),
  content TEXT NOT NULL,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),

  -- Location anchoring (for pointing to specific content)
  location_anchor TEXT,
  selection_text TEXT,

  -- Resolution workflow
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'resolved', 'wont_fix')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Threading support
  parent_id UUID REFERENCES public.review_notes(id) ON DELETE CASCADE,
  thread_root_id UUID REFERENCES public.review_notes(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_review_notes_workpaper
  ON public.review_notes(workpaper_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_procedure
  ON public.review_notes(procedure_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_author
  ON public.review_notes(author_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_status
  ON public.review_notes(status);

CREATE INDEX IF NOT EXISTS idx_review_notes_thread
  ON public.review_notes(thread_root_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_parent
  ON public.review_notes(parent_id);

CREATE INDEX IF NOT EXISTS idx_review_notes_open
  ON public.review_notes(workpaper_id, status)
  WHERE status = 'open';

-- Enable Row Level Security
ALTER TABLE public.review_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view notes for workpapers in their firm's engagements
CREATE POLICY "Users can view notes in their firm"
  ON public.review_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.audit_workpapers wp
      JOIN public.audits a ON a.id = wp.audit_id
      WHERE wp.id = review_notes.workpaper_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- RLS Policy: Users can create notes for workpapers in their firm's engagements
CREATE POLICY "Users can create notes in their firm"
  ON public.review_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.audit_workpapers wp
      JOIN public.audits a ON a.id = wp.audit_id
      WHERE wp.id = workpaper_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- RLS Policy: Users can update notes in their firm's engagements
CREATE POLICY "Users can update notes in their firm"
  ON public.review_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.audit_workpapers wp
      JOIN public.audits a ON a.id = wp.audit_id
      WHERE wp.id = review_notes.workpaper_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- RLS Policy: Authors can delete their own notes (if not resolved)
CREATE POLICY "Authors can delete their own notes"
  ON public.review_notes
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND status = 'open'
  );

-- Trigger: Auto-set thread_root_id on insert
CREATE OR REPLACE FUNCTION set_thread_root_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply, inherit the thread_root_id from parent
  -- Otherwise, set thread_root_id to self (new thread)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT COALESCE(thread_root_id, id) INTO NEW.thread_root_id
    FROM public.review_notes
    WHERE id = NEW.parent_id;
  ELSE
    NEW.thread_root_id := NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_thread_root_id
  BEFORE INSERT ON public.review_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_thread_root_id();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_notes_updated_at
  BEFORE UPDATE ON public.review_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_notes_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.review_notes IS 'Review comments and notes on workpapers with threading and resolution workflow support';
COMMENT ON COLUMN public.review_notes.note_type IS 'Type of note: comment (general), question (needs answer), issue (problem found), suggestion (improvement idea)';
COMMENT ON COLUMN public.review_notes.location_anchor IS 'CSS selector or content hash to anchor note to specific workpaper location';
COMMENT ON COLUMN public.review_notes.thread_root_id IS 'ID of the root note in this thread (for nested replies)';
COMMENT ON COLUMN public.review_notes.status IS 'Resolution status: open (needs attention), addressed (work done), resolved (closed), wont_fix (declined)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ DB-002: review_notes table created successfully';
END $$;
