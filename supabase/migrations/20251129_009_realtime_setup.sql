-- ============================================================================
-- Migration: Real-time Configuration
-- Version: 20251129_009
-- Description: Enables real-time subscriptions for collaborative features
-- Dependencies: 20251129_008_storage_setup.sql
-- ============================================================================

-- ============================================================================
-- ENABLE REALTIME ON TABLES
-- ============================================================================

-- Enable realtime for audit procedures (collaborative editing)
ALTER PUBLICATION supabase_realtime ADD TABLE audit_procedures;

-- Enable realtime for review notes (real-time feedback)
ALTER PUBLICATION supabase_realtime ADD TABLE review_notes;

-- Enable realtime for audit reports (collaborative report writing)
ALTER PUBLICATION supabase_realtime ADD TABLE audit_reports;

-- Enable realtime for engagements (status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE engagements;

-- Enable realtime for notifications (instant notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for comments (real-time discussions)
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Enable realtime for signoffs (approval workflow)
ALTER PUBLICATION supabase_realtime ADD TABLE signoffs;

-- Enable realtime for audit findings (issue tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE audit_findings;

-- Enable realtime for organization members (team management)
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;

-- ============================================================================
-- PRESENCE TRACKING TABLE
-- ============================================================================
-- Tracks which users are currently viewing which engagements/procedures

CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE CASCADE,
  page_type TEXT CHECK (page_type IN ('dashboard', 'engagement', 'procedure', 'report', 'client', 'other')),
  page_id TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_engagement ON user_presence(engagement_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_procedure ON user_presence(procedure_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Enable realtime for presence tracking
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- ============================================================================
-- PRESENCE TRACKING POLICIES
-- ============================================================================

CREATE POLICY "Organization members can view presence"
  ON user_presence FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create own presence"
  ON user_presence FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own presence"
  ON user_presence FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PRESENCE TRACKING FUNCTIONS
-- ============================================================================

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_engagement_id UUID DEFAULT NULL,
  p_procedure_id UUID DEFAULT NULL,
  p_page_type TEXT DEFAULT 'other',
  p_page_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_presence_id UUID;
  v_organization_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Delete old presence records for this user
  DELETE FROM user_presence
  WHERE user_id = auth.uid();

  -- Insert new presence record
  INSERT INTO user_presence (
    user_id,
    organization_id,
    engagement_id,
    procedure_id,
    page_type,
    page_id,
    metadata
  ) VALUES (
    auth.uid(),
    v_organization_id,
    p_engagement_id,
    p_procedure_id,
    p_page_type,
    p_page_id,
    p_metadata
  )
  RETURNING id INTO v_presence_id;

  RETURN v_presence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active users on engagement
CREATE OR REPLACE FUNCTION get_active_users_on_engagement(engagement_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  page_type TEXT,
  procedure_id UUID,
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    u.full_name,
    u.avatar_url,
    up.page_type,
    up.procedure_id,
    up.last_seen
  FROM user_presence up
  JOIN user_profiles u ON up.user_id = u.id
  WHERE up.engagement_id = get_active_users_on_engagement.engagement_id
    AND up.last_seen > NOW() - INTERVAL '5 minutes'
  ORDER BY up.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active users on procedure
CREATE OR REPLACE FUNCTION get_active_users_on_procedure(procedure_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  last_seen TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    u.full_name,
    u.avatar_url,
    up.last_seen
  FROM user_presence up
  JOIN user_profiles u ON up.user_id = u.id
  WHERE up.procedure_id = get_active_users_on_procedure.procedure_id
    AND up.last_seen > NOW() - INTERVAL '2 minutes'
  ORDER BY up.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up stale presence records
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_presence
  WHERE last_seen < NOW() - INTERVAL '10 minutes';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to notify on review note creation
CREATE OR REPLACE FUNCTION notify_review_note_created()
RETURNS TRIGGER AS $$
DECLARE
  v_procedure_assigned_to UUID;
  v_engagement_id UUID;
  v_organization_id UUID;
BEGIN
  -- Get procedure details
  SELECT assigned_to, engagement_id, organization_id
  INTO v_procedure_assigned_to, v_engagement_id, v_organization_id
  FROM audit_procedures
  WHERE id = NEW.procedure_id;

  -- Create notification for assigned user
  IF v_procedure_assigned_to IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      v_procedure_assigned_to,
      v_organization_id,
      'review_note',
      'New Review Note',
      'You have a new review note on a procedure',
      '/engagements/' || v_engagement_id || '/procedures/' || NEW.procedure_id,
      jsonb_build_object(
        'procedure_id', NEW.procedure_id,
        'review_note_id', NEW.id,
        'reviewer_id', NEW.reviewer_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_note_created
  AFTER INSERT ON review_notes
  FOR EACH ROW
  EXECUTE FUNCTION notify_review_note_created();

-- Function to notify on procedure assignment
CREATE OR REPLACE FUNCTION notify_procedure_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_engagement_id UUID;
  v_organization_id UUID;
BEGIN
  -- Only notify if assigned_to changed and is not null
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    -- Get engagement details
    SELECT id, organization_id
    INTO v_engagement_id, v_organization_id
    FROM engagements
    WHERE id = NEW.engagement_id;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      NEW.assigned_to,
      v_organization_id,
      'procedure_assigned',
      'Procedure Assigned',
      'You have been assigned to procedure: ' || NEW.title,
      '/engagements/' || v_engagement_id || '/procedures/' || NEW.id,
      jsonb_build_object(
        'procedure_id', NEW.id,
        'engagement_id', v_engagement_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_procedure_assigned
  AFTER INSERT OR UPDATE ON audit_procedures
  FOR EACH ROW
  EXECUTE FUNCTION notify_procedure_assigned();

-- Function to notify on sign-off request
CREATE OR REPLACE FUNCTION notify_signoff_created()
RETURNS TRIGGER AS $$
BEGIN
  -- This could send notifications to the next level reviewer
  -- Implementation depends on workflow requirements
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_signoff_created
  AFTER INSERT ON signoffs
  FOR EACH ROW
  EXECUTE FUNCTION notify_signoff_created();

-- ============================================================================
-- REAL-TIME HELPER FUNCTIONS
-- ============================================================================

-- Function to broadcast engagement update
CREATE OR REPLACE FUNCTION broadcast_engagement_update(engagement_id UUID, update_type TEXT)
RETURNS VOID AS $$
BEGIN
  -- This is a placeholder for real-time broadcast logic
  -- Actual implementation would use pg_notify
  PERFORM pg_notify(
    'engagement_updates',
    json_build_object(
      'engagement_id', engagement_id,
      'update_type', update_type,
      'timestamp', NOW()
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast procedure update
CREATE OR REPLACE FUNCTION broadcast_procedure_update(procedure_id UUID, update_type TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_notify(
    'procedure_updates',
    json_build_object(
      'procedure_id', procedure_id,
      'update_type', update_type,
      'timestamp', NOW()
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE user_presence IS 'Tracks active users and what they are viewing in real-time';
COMMENT ON FUNCTION update_user_presence IS 'Updates or creates presence record for current user';
COMMENT ON FUNCTION get_active_users_on_engagement IS 'Returns list of users currently active on an engagement';
COMMENT ON FUNCTION cleanup_stale_presence IS 'Removes presence records older than 10 minutes';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20251129_009_realtime_setup.sql completed successfully';
  RAISE NOTICE 'Real-time enabled on 9 tables';
  RAISE NOTICE 'Presence tracking configured';
  RAISE NOTICE 'Real-time notification triggers created';
END $$;
