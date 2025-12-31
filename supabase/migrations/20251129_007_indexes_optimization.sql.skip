-- ============================================================================
-- Migration: Indexes & Optimization
-- Version: 20251129_007
-- Description: Creates additional indexes, full-text search, and optimization features
-- Dependencies: 20251129_006_documents_storage.sql
-- ============================================================================

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Add tsvector column for procedures full-text search
ALTER TABLE audit_procedures
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(code, '') || ' ' ||
      coalesce(title, '') || ' ' ||
      coalesce(objective, '') || ' ' ||
      coalesce(instructions, '') || ' ' ||
      coalesce(conclusion, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_audit_procedures_search
  ON audit_procedures USING GIN (search_vector);

-- Add tsvector column for clients full-text search
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(legal_name, '') || ' ' ||
      coalesce(industry, '') || ' ' ||
      coalesce(notes, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_clients_search
  ON clients USING GIN (search_vector);

-- Add tsvector column for engagements full-text search
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(engagement_type, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_engagements_search
  ON engagements USING GIN (search_vector);

-- Add tsvector column for documents full-text search
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(file_name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(category, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_documents_search
  ON documents USING GIN (search_vector);

-- Add tsvector column for findings full-text search
ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(impact_description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_audit_findings_search
  ON audit_findings USING GIN (search_vector);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Procedures: organization + status + assigned user
CREATE INDEX IF NOT EXISTS idx_procedures_org_status_assigned
  ON audit_procedures(organization_id, status, assigned_to)
  WHERE status NOT IN ('completed', 'approved');

-- Engagements: organization + client + status
CREATE INDEX IF NOT EXISTS idx_engagements_org_client_status
  ON engagements(organization_id, client_id, status)
  WHERE status NOT IN ('archived');

-- Findings: organization + severity + status
CREATE INDEX IF NOT EXISTS idx_findings_org_severity_status
  ON audit_findings(organization_id, severity, status);

-- Time entries: user + date for timesheet views
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date
  ON time_entries(user_id, date DESC);

-- Review notes: procedure + status for open items
CREATE INDEX IF NOT EXISTS idx_review_notes_procedure_status
  ON review_notes(procedure_id, status)
  WHERE status = 'open';

-- Notifications: user + read status + created date
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, read, created_at DESC);

-- ============================================================================
-- JSONB INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Index on team_members JSONB in engagements
CREATE INDEX IF NOT EXISTS idx_engagements_team_members
  ON engagements USING GIN (team_members);

-- Index on risk_areas JSONB in risk_assessments
CREATE INDEX IF NOT EXISTS idx_risk_areas_jsonb
  ON risk_assessments USING GIN (risk_areas);

-- Index on settings JSONB in organizations
CREATE INDEX IF NOT EXISTS idx_organizations_settings
  ON organizations USING GIN (settings);

-- ============================================================================
-- SEARCH FUNCTIONS
-- ============================================================================

-- Global search function across all entities
CREATE OR REPLACE FUNCTION global_search(
  org_id UUID,
  search_query TEXT,
  search_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  relevance REAL,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Search procedures
  SELECT
    'procedure'::TEXT AS entity_type,
    ap.id AS entity_id,
    ap.title AS title,
    ap.code || ': ' || COALESCE(ap.objective, '') AS description,
    ts_rank(ap.search_vector, websearch_to_tsquery('english', search_query)) AS relevance,
    jsonb_build_object(
      'engagement_id', ap.engagement_id,
      'status', ap.status,
      'category', ap.category
    ) AS metadata
  FROM audit_procedures ap
  WHERE
    ap.organization_id = org_id
    AND ap.search_vector @@ websearch_to_tsquery('english', search_query)

  UNION ALL

  -- Search clients
  SELECT
    'client'::TEXT AS entity_type,
    c.id AS entity_id,
    c.name AS title,
    COALESCE(c.industry, '') || ' - ' || COALESCE(c.entity_type, '') AS description,
    ts_rank(c.search_vector, websearch_to_tsquery('english', search_query)) AS relevance,
    jsonb_build_object(
      'status', c.status,
      'risk_rating', c.risk_rating
    ) AS metadata
  FROM clients c
  WHERE
    c.organization_id = org_id
    AND c.search_vector @@ websearch_to_tsquery('english', search_query)

  UNION ALL

  -- Search engagements
  SELECT
    'engagement'::TEXT AS entity_type,
    e.id AS entity_id,
    e.name AS title,
    e.engagement_type AS description,
    ts_rank(e.search_vector, websearch_to_tsquery('english', search_query)) AS relevance,
    jsonb_build_object(
      'client_id', e.client_id,
      'status', e.status,
      'fiscal_year_end', e.fiscal_year_end
    ) AS metadata
  FROM engagements e
  WHERE
    e.organization_id = org_id
    AND e.search_vector @@ websearch_to_tsquery('english', search_query)

  UNION ALL

  -- Search documents
  SELECT
    'document'::TEXT AS entity_type,
    d.id AS entity_id,
    d.file_name AS title,
    COALESCE(d.description, '') AS description,
    ts_rank(d.search_vector, websearch_to_tsquery('english', search_query)) AS relevance,
    jsonb_build_object(
      'engagement_id', d.engagement_id,
      'category', d.category,
      'file_type', d.file_type
    ) AS metadata
  FROM documents d
  WHERE
    d.organization_id = org_id
    AND d.search_vector @@ websearch_to_tsquery('english', search_query)
    AND d.is_latest_version = true

  UNION ALL

  -- Search findings
  SELECT
    'finding'::TEXT AS entity_type,
    af.id AS entity_id,
    af.title AS title,
    af.description AS description,
    ts_rank(af.search_vector, websearch_to_tsquery('english', search_query)) AS relevance,
    jsonb_build_object(
      'engagement_id', af.engagement_id,
      'severity', af.severity,
      'status', af.status
    ) AS metadata
  FROM audit_findings af
  WHERE
    af.organization_id = org_id
    AND af.search_vector @@ websearch_to_tsquery('english', search_query)

  ORDER BY relevance DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search procedures function
CREATE OR REPLACE FUNCTION search_procedures(
  org_id UUID,
  search_query TEXT,
  search_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  title TEXT,
  engagement_id UUID,
  status TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.code,
    p.title,
    p.engagement_id,
    p.status,
    ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) AS relevance
  FROM audit_procedures p
  WHERE
    p.organization_id = org_id
    AND p.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY relevance DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Engagement statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS engagement_stats AS
SELECT
  e.id,
  e.organization_id,
  e.client_id,
  e.status,
  e.engagement_type,
  COUNT(DISTINCT ap.id) AS total_procedures,
  COUNT(DISTINCT ap.id) FILTER (WHERE ap.status IN ('completed', 'reviewed', 'approved')) AS completed_procedures,
  CASE
    WHEN COUNT(DISTINCT ap.id) > 0
    THEN ROUND((COUNT(DISTINCT ap.id) FILTER (WHERE ap.status IN ('completed', 'reviewed', 'approved'))::DECIMAL / COUNT(DISTINCT ap.id)::DECIMAL) * 100, 2)
    ELSE 0
  END AS completion_percentage,
  SUM(ap.estimated_hours) AS estimated_hours,
  SUM(ap.actual_hours) AS actual_hours,
  COUNT(DISTINCT af.id) AS total_findings,
  COUNT(DISTINCT af.id) FILTER (WHERE af.severity = 'significant') AS significant_findings,
  COUNT(DISTINCT af.id) FILTER (WHERE af.severity = 'critical') AS critical_findings,
  COUNT(DISTINCT d.id) AS total_documents,
  COUNT(DISTINCT rn.id) FILTER (WHERE rn.status = 'open') AS open_review_notes
FROM engagements e
LEFT JOIN audit_procedures ap ON ap.engagement_id = e.id
LEFT JOIN audit_findings af ON af.engagement_id = e.id
LEFT JOIN documents d ON d.engagement_id = e.id AND d.is_latest_version = true
LEFT JOIN review_notes rn ON rn.engagement_id = e.id
GROUP BY e.id;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_engagement_stats_org ON engagement_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_engagement_stats_client ON engagement_stats(client_id);
CREATE INDEX IF NOT EXISTS idx_engagement_stats_status ON engagement_stats(status);

-- Organization statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS organization_stats AS
SELECT
  o.id AS organization_id,
  COUNT(DISTINCT c.id) AS total_clients,
  COUNT(DISTINCT e.id) AS total_engagements,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'planning') AS engagements_planning,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'fieldwork') AS engagements_fieldwork,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'review') AS engagements_review,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'reporting') AS engagements_reporting,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') AS engagements_completed,
  COUNT(DISTINCT om.id) FILTER (WHERE om.status = 'active') AS active_members,
  COUNT(DISTINCT ap.id) AS total_procedures,
  COUNT(DISTINCT ap.id) FILTER (WHERE ap.status IN ('completed', 'reviewed', 'approved')) AS completed_procedures,
  COUNT(DISTINCT af.id) AS total_findings,
  SUM(d.file_size) FILTER (WHERE d.is_latest_version = true) AS total_storage_bytes
FROM organizations o
LEFT JOIN clients c ON c.organization_id = o.id
LEFT JOIN engagements e ON e.organization_id = o.id
LEFT JOIN organization_members om ON om.organization_id = o.id
LEFT JOIN audit_procedures ap ON ap.organization_id = o.id
LEFT JOIN audit_findings af ON af.organization_id = o.id
LEFT JOIN documents d ON d.organization_id = o.id
GROUP BY o.id;

CREATE INDEX IF NOT EXISTS idx_organization_stats_org ON organization_stats(organization_id);

-- ============================================================================
-- FUNCTIONS TO REFRESH MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh engagement stats
CREATE OR REPLACE FUNCTION refresh_engagement_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY engagement_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh organization stats
CREATE OR REPLACE FUNCTION refresh_organization_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY organization_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERFORMANCE HELPER FUNCTIONS
-- ============================================================================

-- Function to get engagement progress
CREATE OR REPLACE FUNCTION get_engagement_progress(engagement_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_procedures', COALESCE(total_procedures, 0),
    'completed_procedures', COALESCE(completed_procedures, 0),
    'completion_percentage', COALESCE(completion_percentage, 0),
    'estimated_hours', COALESCE(estimated_hours, 0),
    'actual_hours', COALESCE(actual_hours, 0),
    'total_findings', COALESCE(total_findings, 0),
    'open_review_notes', COALESCE(open_review_notes, 0)
  ) INTO result
  FROM engagement_stats
  WHERE id = engagement_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user workload
CREATE OR REPLACE FUNCTION get_user_workload(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'assigned_procedures', COUNT(DISTINCT ap.id),
    'not_started', COUNT(DISTINCT ap.id) FILTER (WHERE ap.status = 'not_started'),
    'in_progress', COUNT(DISTINCT ap.id) FILTER (WHERE ap.status = 'in_progress'),
    'completed', COUNT(DISTINCT ap.id) FILTER (WHERE ap.status IN ('completed', 'reviewed', 'approved')),
    'open_review_notes', COUNT(DISTINCT rn.id) FILTER (WHERE rn.status = 'open'),
    'total_estimated_hours', COALESCE(SUM(ap.estimated_hours), 0),
    'total_actual_hours', COALESCE(SUM(ap.actual_hours), 0)
  ) INTO result
  FROM audit_procedures ap
  LEFT JOIN review_notes rn ON rn.procedure_id = ap.id AND rn.status = 'open'
  WHERE ap.assigned_to = user_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to archive old engagements
CREATE OR REPLACE FUNCTION archive_old_engagements(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE engagements
  SET status = 'archived'
  WHERE status = 'completed'
    AND report_date < CURRENT_DATE - (days_old || ' days')::INTERVAL
    AND status != 'archived';

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE read = true
    AND read_at < CURRENT_DATE - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON FUNCTION global_search IS 'Full-text search across procedures, clients, engagements, documents, and findings';
COMMENT ON FUNCTION search_procedures IS 'Full-text search specifically for audit procedures';
COMMENT ON MATERIALIZED VIEW engagement_stats IS 'Aggregated statistics for each engagement';
COMMENT ON MATERIALIZED VIEW organization_stats IS 'Aggregated statistics for each organization';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_007_indexes_optimization.sql completed successfully';
  RAISE NOTICE 'Total tables created: 20+';
  RAISE NOTICE 'Total indexes created: 100+';
  RAISE NOTICE 'Full-text search enabled on 5 tables';
  RAISE NOTICE 'Materialized views created: 2';
END $$;
