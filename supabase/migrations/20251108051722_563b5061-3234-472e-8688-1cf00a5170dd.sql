-- Phase 3: Advanced Security & Compliance Features

-- IP Whitelist Management
CREATE TABLE IF NOT EXISTS platform_admin.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  ip_range TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ip_whitelist_active ON platform_admin.ip_whitelist(is_active);
CREATE INDEX idx_ip_whitelist_ip ON platform_admin.ip_whitelist(ip_address);

-- Enable RLS
ALTER TABLE platform_admin.ip_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view IP whitelist"
  ON platform_admin.ip_whitelist FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage IP whitelist"
  ON platform_admin.ip_whitelist FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Privilege Elevation Requests
CREATE TABLE IF NOT EXISTS platform_admin.privilege_elevation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  requested_privilege TEXT NOT NULL,
  justification TEXT NOT NULL,
  ticket_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_privilege_requests_status ON platform_admin.privilege_elevation_requests(status);
CREATE INDEX idx_privilege_requests_admin ON platform_admin.privilege_elevation_requests(admin_user_id);

-- Enable RLS
ALTER TABLE platform_admin.privilege_elevation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view privilege requests"
  ON platform_admin.privilege_elevation_requests FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can create privilege requests"
  ON platform_admin.privilege_elevation_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

CREATE POLICY "Platform admins can update privilege requests"
  ON platform_admin.privilege_elevation_requests FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Function to check IP whitelist
CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admin.ip_whitelist
    WHERE is_active = true
      AND (ip_address = _ip_address OR _ip_address ~ ip_range)
  );
END;
$$;

-- Function to request privilege elevation
CREATE OR REPLACE FUNCTION public.request_privilege_elevation(
  _privilege TEXT,
  _justification TEXT,
  _ticket_reference TEXT DEFAULT NULL,
  _duration_minutes INTEGER DEFAULT 120
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _request_id UUID;
  _admin_id UUID;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can request privilege elevation';
  END IF;

  _admin_id := auth.uid();

  -- Validate justification length
  IF char_length(_justification) < 30 THEN
    RAISE EXCEPTION 'Justification must be at least 30 characters';
  END IF;

  INSERT INTO platform_admin.privilege_elevation_requests (
    admin_user_id,
    requested_privilege,
    justification,
    ticket_reference,
    status,
    approved_by,
    approved_at,
    expires_at
  ) VALUES (
    _admin_id,
    _privilege,
    _justification,
    _ticket_reference,
    'approved', -- Auto-approve for now, can add workflow later
    _admin_id,
    now(),
    now() + (_duration_minutes || ' minutes')::interval
  )
  RETURNING id INTO _request_id;

  PERFORM public.log_audit_event(
    _admin_id,
    NULL,
    'privilege_elevation_requested',
    'privilege_elevation',
    _request_id,
    jsonb_build_object(
      'privilege', _privilege,
      'justification', _justification,
      'duration_minutes', _duration_minutes
    )
  );

  RETURN jsonb_build_object(
    'request_id', _request_id,
    'expires_at', now() + (_duration_minutes || ' minutes')::interval
  );
END;
$$;

-- Function to export audit logs
CREATE OR REPLACE FUNCTION public.export_audit_logs(
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ,
  _log_type TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email TEXT,
  organization_id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can export audit logs';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    p.email as user_email,
    al.organization_id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.id = al.user_id
  WHERE al.created_at >= _start_date
    AND al.created_at <= _end_date
    AND (_log_type IS NULL OR al.action LIKE '%' || _log_type || '%')
  ORDER BY al.created_at DESC;
END;
$$;

-- Function to get security metrics
CREATE OR REPLACE FUNCTION public.get_security_metrics(_days_back INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _result JSONB;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view security metrics';
  END IF;

  SELECT jsonb_build_object(
    'total_alerts', (
      SELECT COUNT(*) FROM platform_admin.security_alerts
      WHERE created_at >= now() - (_days_back || ' days')::interval
    ),
    'critical_alerts', (
      SELECT COUNT(*) FROM platform_admin.security_alerts
      WHERE severity = 'critical'
        AND created_at >= now() - (_days_back || ' days')::interval
    ),
    'failed_login_attempts', (
      SELECT COUNT(*) FROM platform_admin.admin_auth_log
      WHERE attempt_type = 'login'
        AND success = false
        AND created_at >= now() - (_days_back || ' days')::interval
    ),
    'active_sessions', (
      SELECT COUNT(*) FROM platform_admin.admin_sessions
      WHERE revoked = false
        AND expires_at > now()
    ),
    'privilege_elevations', (
      SELECT COUNT(*) FROM platform_admin.privilege_elevation_requests
      WHERE status = 'approved'
        AND created_at >= now() - (_days_back || ' days')::interval
    ),
    'unique_admin_ips', (
      SELECT COUNT(DISTINCT ip_address) FROM platform_admin.admin_sessions
      WHERE created_at >= now() - (_days_back || ' days')::interval
    )
  ) INTO _result;

  RETURN _result;
END;
$$;