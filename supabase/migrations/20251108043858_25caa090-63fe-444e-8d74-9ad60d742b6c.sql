-- Fix security warning: Set search_path for get_performance_summary function
CREATE OR REPLACE FUNCTION public.get_performance_summary(
  _org_id UUID DEFAULT NULL,
  _hours_back INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  _result JSONB;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view performance summary';
  END IF;

  SELECT jsonb_build_object(
    'avg_query_time', (
      SELECT COALESCE(AVG(value), 0) FROM platform_admin.performance_metrics
      WHERE metric_type = 'query_time'
        AND timestamp > now() - (_hours_back || ' hours')::interval
        AND (_org_id IS NULL OR organization_id = _org_id)
    ),
    'p95_query_time', (
      SELECT COALESCE(AVG(p95), 0) FROM platform_admin.performance_metrics
      WHERE metric_type = 'query_time'
        AND timestamp > now() - (_hours_back || ' hours')::interval
        AND (_org_id IS NULL OR organization_id = _org_id)
    ),
    'avg_cpu_usage', (
      SELECT COALESCE(AVG(value), 0) FROM platform_admin.performance_metrics
      WHERE metric_type = 'cpu_usage'
        AND timestamp > now() - (_hours_back || ' hours')::interval
        AND (_org_id IS NULL OR organization_id = _org_id)
    ),
    'sla_violations_count', (
      SELECT COUNT(*) FROM platform_admin.sla_violations
      WHERE violation_start > now() - (_hours_back || ' hours')::interval
        AND (_org_id IS NULL OR organization_id = _org_id)
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Fix security warning: Set search_path for calculate_sla_violation_duration function
CREATE OR REPLACE FUNCTION platform_admin.calculate_sla_violation_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  IF NEW.violation_end IS NOT NULL AND (OLD IS NULL OR OLD.violation_end IS NULL OR OLD.violation_end != NEW.violation_end) THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.violation_end - NEW.violation_start))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$;