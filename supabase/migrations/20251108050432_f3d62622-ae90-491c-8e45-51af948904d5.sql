-- Create admin authentication logs table
CREATE TABLE IF NOT EXISTS platform_admin.admin_auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type text NOT NULL CHECK (attempt_type IN ('login', 'mfa_challenge', 'session_refresh', 'logout', 'access_denied')),
  success boolean NOT NULL,
  ip_address inet,
  user_agent text,
  location jsonb,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create admin session management table
CREATE TABLE IF NOT EXISTS platform_admin.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now(),
  revoked boolean DEFAULT false,
  revoked_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create IP whitelist table
CREATE TABLE IF NOT EXISTS platform_admin.admin_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_range inet NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create admin access policies table
CREATE TABLE IF NOT EXISTS platform_admin.admin_access_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name text NOT NULL,
  policy_type text NOT NULL CHECK (policy_type IN ('session_timeout', 'mfa_required', 'ip_whitelist_enabled', 'max_sessions')),
  policy_value jsonb NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_admin.admin_auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.admin_ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.admin_access_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_auth_logs
CREATE POLICY "Platform admins can view all auth logs"
  ON platform_admin.admin_auth_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "System can insert auth logs"
  ON platform_admin.admin_auth_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for admin_sessions
CREATE POLICY "Platform admins can view all sessions"
  ON platform_admin.admin_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "System can manage sessions"
  ON platform_admin.admin_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for admin_ip_whitelist
CREATE POLICY "Platform admins can view IP whitelist"
  ON platform_admin.admin_ip_whitelist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can manage IP whitelist"
  ON platform_admin.admin_ip_whitelist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

-- RLS Policies for admin_access_policies
CREATE POLICY "Platform admins can view access policies"
  ON platform_admin.admin_access_policies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can manage access policies"
  ON platform_admin.admin_access_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM platform_admin.admin_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

-- Create function to validate admin session
CREATE OR REPLACE FUNCTION platform_admin.validate_admin_session(
  _session_token text,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM platform_admin.admin_sessions
    WHERE session_token = _session_token
      AND user_id = _user_id
      AND NOT revoked
      AND expires_at > now()
      AND last_activity > now() - interval '30 minutes'
  );
END;
$$;

-- Create function to log admin authentication attempt
CREATE OR REPLACE FUNCTION platform_admin.log_admin_auth_attempt(
  _user_id uuid,
  _attempt_type text,
  _success boolean,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _failure_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO platform_admin.admin_auth_logs (
    user_id,
    attempt_type,
    success,
    ip_address,
    user_agent,
    failure_reason
  ) VALUES (
    _user_id,
    _attempt_type,
    _success,
    _ip_address,
    _user_agent,
    _failure_reason
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Create function to check if IP is whitelisted
CREATE OR REPLACE FUNCTION platform_admin.is_ip_whitelisted(_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If no whitelist entries exist, allow all IPs
  IF NOT EXISTS (SELECT 1 FROM platform_admin.admin_ip_whitelist WHERE enabled = true) THEN
    RETURN true;
  END IF;
  
  -- Check if IP is in whitelist
  RETURN EXISTS (
    SELECT 1 
    FROM platform_admin.admin_ip_whitelist
    WHERE enabled = true
      AND _ip_address <<= ip_range
  );
END;
$$;

-- Create function to create admin session
CREATE OR REPLACE FUNCTION platform_admin.create_admin_session(
  _user_id uuid,
  _ip_address inet,
  _user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _session_token text;
  _expires_at timestamptz;
BEGIN
  -- Generate session token
  _session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Set expiration (30 minutes from now)
  _expires_at := now() + interval '30 minutes';
  
  -- Create session
  INSERT INTO platform_admin.admin_sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    _user_id,
    _session_token,
    _ip_address,
    _user_agent,
    _expires_at
  );
  
  RETURN _session_token;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_auth_logs_user_id ON platform_admin.admin_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_auth_logs_created_at ON platform_admin.admin_auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON platform_admin.admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON platform_admin.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON platform_admin.admin_sessions(expires_at);

-- Insert default access policies
INSERT INTO platform_admin.admin_access_policies (policy_name, policy_type, policy_value, enabled) VALUES
  ('Session Timeout', 'session_timeout', '{"minutes": 30}'::jsonb, true),
  ('MFA Required', 'mfa_required', '{"required": true}'::jsonb, true),
  ('IP Whitelist Enabled', 'ip_whitelist_enabled', '{"enabled": false}'::jsonb, false),
  ('Max Sessions Per Admin', 'max_sessions', '{"max": 3}'::jsonb, true)
ON CONFLICT DO NOTHING;