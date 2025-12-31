-- ============================================================================
-- Migration: Documents & Storage Tables
-- Version: 20251129_006
-- Description: Creates tables for document management and version control
-- Dependencies: 20251129_005_review_collaboration.sql
-- ============================================================================

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT CHECK (file_size >= 0),
  file_type TEXT,
  mime_type TEXT,
  category TEXT CHECK (category IN (
    'workpaper',
    'client_provided',
    'supporting_document',
    'report',
    'correspondence',
    'other'
  )),
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  version INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT true,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  virus_scanned BOOLEAN DEFAULT false,
  virus_scan_result TEXT,
  metadata JSONB DEFAULT '{
    "checksum": "",
    "width": null,
    "height": null,
    "duration": null
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_engagement ON documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_documents_procedure ON documents(procedure_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_latest_version ON documents(is_latest_version) WHERE is_latest_version = true;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOCUMENT VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT CHECK (file_size >= 0),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  change_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_uploaded_by ON document_versions(uploaded_by);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOCUMENT SHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_with UUID REFERENCES auth.users(id),
  share_type TEXT DEFAULT 'internal' CHECK (share_type IN ('internal', 'external', 'client')),
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'download', 'edit')),
  expiry_date TIMESTAMPTZ,
  password_protected BOOLEAN DEFAULT false,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_document_shares_organization ON document_shares(organization_id);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'audit_program',
    'procedure',
    'report',
    'memo',
    'checklist',
    'other'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  variables JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_organization ON templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public) WHERE is_public = true;

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TIME TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  description TEXT,
  hours DECIMAL(6,2) NOT NULL CHECK (hours > 0),
  date DATE NOT NULL,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_engagement ON time_entries(engagement_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_procedure ON time_entries(procedure_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization ON time_entries(organization_id);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'procedure',
    'document',
    'finding',
    'adjustment',
    'report'
  )),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  mentions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_organization ON comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Documents Policies
CREATE POLICY "Organization members can view documents"
  ON documents FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can upload documents"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) AND uploaded_by = auth.uid()
  );

CREATE POLICY "Organization members can update their documents"
  ON documents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) AND (
      uploaded_by = auth.uid() OR
      auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = documents.organization_id
        AND role IN ('admin', 'partner', 'manager')
      )
    )
  );

CREATE POLICY "Uploader or managers can delete documents"
  ON documents FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) AND (
      uploaded_by = auth.uid() OR
      auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = documents.organization_id
        AND role IN ('admin', 'partner', 'manager')
      )
    )
  );

-- Document Versions Policies
CREATE POLICY "Organization members can view document versions"
  ON document_versions FOR SELECT
  USING (document_id IN (
    SELECT id FROM documents
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create document versions"
  ON document_versions FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Document Shares Policies
CREATE POLICY "Organization members can view document shares"
  ON document_shares FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create document shares"
  ON document_shares FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) AND shared_by = auth.uid()
  );

-- Templates Policies
CREATE POLICY "Organization members can view templates"
  ON templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) OR is_public = true
  );

CREATE POLICY "Organization members can manage templates"
  ON templates FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Time Entries Policies
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'partner', 'manager')
  ));

CREATE POLICY "Users can create own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (user_id = auth.uid() AND status = 'draft');

-- Comments Policies
CREATE POLICY "Organization members can view comments"
  ON comments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to create new document version
CREATE OR REPLACE FUNCTION create_document_version(
  p_document_id UUID,
  p_storage_path TEXT,
  p_file_size BIGINT,
  p_change_summary TEXT
)
RETURNS UUID AS $$
DECLARE
  v_version_number INTEGER;
  v_version_id UUID;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM document_versions
  WHERE document_id = p_document_id;

  -- Insert version record
  INSERT INTO document_versions (
    document_id,
    version_number,
    storage_path,
    file_size,
    uploaded_by,
    change_summary
  ) VALUES (
    p_document_id,
    v_version_number,
    p_storage_path,
    p_file_size,
    auth.uid(),
    p_change_summary
  )
  RETURNING id INTO v_version_id;

  -- Update document version
  UPDATE documents
  SET version = v_version_number,
      storage_path = p_storage_path,
      file_size = p_file_size,
      updated_at = NOW()
  WHERE id = p_document_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total storage used by organization
CREATE OR REPLACE FUNCTION get_organization_storage_usage(org_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  SELECT COALESCE(SUM(file_size), 0) INTO total_bytes
  FROM documents
  WHERE organization_id = org_id AND is_latest_version = true;

  RETURN total_bytes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE documents IS 'Stores document metadata and references to files in Supabase Storage';
COMMENT ON TABLE document_versions IS 'Tracks version history of documents';
COMMENT ON TABLE document_shares IS 'Manages document sharing and access permissions';
COMMENT ON TABLE templates IS 'Stores reusable templates for audit programs, procedures, and reports';
COMMENT ON TABLE time_entries IS 'Tracks time spent on engagements and procedures';
COMMENT ON TABLE comments IS 'Stores comments and discussions on various entities';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_006_documents_storage.sql completed successfully';
END $$;
