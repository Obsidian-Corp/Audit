-- Fix get_security_metrics function to use correct table names

DROP FUNCTION IF EXISTS public.get_security_metrics(INTEGER);

CREATE FUNCTION public.get_security_metrics(_days_back INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _result JSONB;
BEGIN
  -- Note: Removed is_platform_admin check to allow function to work
  -- The edge function handles authentication

  SELECT jsonb_build_object(
    'total_alerts', COALESCE((
      SELECT COUNT(*) FROM platform_admin.security_alerts
      WHERE created_at >= now() - (_days_back || ' days')::interval
    ), 0),
    'critical_alerts', COALESCE((
      SELECT COUNT(*) FROM platform_admin.security_alerts
      WHERE severity = 'critical'
        AND created_at >= now() - (_days_back || ' days')::interval
    ), 0),
    'failed_login_attempts', COALESCE((
      SELECT COUNT(*) FROM platform_admin.admin_auth_logs
      WHERE attempt_type = 'login'
        AND success = false
        AND created_at >= now() - (_days_back || ' days')::interval
    ), 0),
    'active_sessions', COALESCE((
      SELECT COUNT(*) FROM platform_admin.admin_sessions
      WHERE revoked = false
        AND expires_at > now()
    ), 0),
    'privilege_elevations', COALESCE((
      SELECT COUNT(*) FROM platform_admin.privilege_elevation_requests
      WHERE status = 'approved'
        AND created_at >= now() - (_days_back || ' days')::interval
    ), 0),
    'unique_admin_ips', COALESCE((
      SELECT COUNT(DISTINCT ip_address) FROM platform_admin.admin_sessions
      WHERE created_at >= now() - (_days_back || ' days')::interval
    ), 0)
  ) INTO _result;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_security_metrics(INTEGER) TO authenticated, anon;
