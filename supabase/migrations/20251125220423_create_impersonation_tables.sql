-- User Impersonation Migration
-- Created: 2025-11-25
-- Purpose: Add user/organization impersonation functionality for platform admins

-- Impersonation Sessions
CREATE TABLE IF NOT EXISTS platform_admin.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_type TEXT CHECK (target_type IN ('organization', 'user')) NOT NULL,
  target_organization_id UUID REFERENCES firms(id),
  target_user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  end_reason TEXT CHECK (end_reason IN ('manual', 'timeout', 'error')),
  ip_address TEXT,
  user_agent TEXT,
  actions_log JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impersonation Action Log
CREATE TABLE IF NOT EXISTS platform_admin.impersonation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES platform_admin.impersonation_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_impersonation_sessions_admin ON platform_admin.impersonation_sessions(admin_id);
CREATE INDEX idx_impersonation_sessions_org ON platform_admin.impersonation_sessions(target_organization_id);
CREATE INDEX idx_impersonation_sessions_user ON platform_admin.impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_sessions_active ON platform_admin.impersonation_sessions(expires_at)
  WHERE ended_at IS NULL;
CREATE INDEX idx_impersonation_actions_session ON platform_admin.impersonation_actions(session_id);
CREATE INDEX idx_impersonation_actions_timestamp ON platform_admin.impersonation_actions(timestamp);

-- RLS Policies
ALTER TABLE platform_admin.impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.impersonation_actions ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view impersonation logs
CREATE POLICY "Platform admins view impersonation logs"
  ON platform_admin.impersonation_sessions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view impersonation actions"
  ON platform_admin.impersonation_actions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));
