-- Performance Monitoring Migration
-- Created: 2025-11-26
-- Purpose: Add performance monitoring, slow query logging, and API performance tracking

-- Slow Query Log
CREATE TABLE IF NOT EXISTS platform_admin.slow_query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  endpoint TEXT,
  organization_id UUID REFERENCES firms(id),
  user_id UUID REFERENCES auth.users(id),
  query_plan JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- API Performance Log
CREATE TABLE IF NOT EXISTS platform_admin.api_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER,
  organization_id UUID REFERENCES firms(id),
  user_id UUID REFERENCES auth.users(id),
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- API Performance Aggregates (for fast queries)
CREATE TABLE IF NOT EXISTS platform_admin.api_performance_hourly (
  endpoint TEXT,
  method TEXT,
  hour TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  p50_response_time_ms INTEGER DEFAULT 0,
  p95_response_time_ms INTEGER DEFAULT 0,
  p99_response_time_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  PRIMARY KEY (endpoint, method, hour)
);

-- Resource Utilization
CREATE TABLE IF NOT EXISTS platform_admin.resource_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT CHECK (metric_type IN ('database_size', 'storage_used', 'connection_count', 'function_invocations')),
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Alerts
CREATE TABLE IF NOT EXISTS platform_admin.performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT CHECK (alert_type IN ('slow_query', 'high_error_rate', 'resource_threshold')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_slow_query_log_time ON platform_admin.slow_query_log(execution_time_ms DESC);
CREATE INDEX idx_slow_query_log_timestamp ON platform_admin.slow_query_log(timestamp DESC);
CREATE INDEX idx_slow_query_log_endpoint ON platform_admin.slow_query_log(endpoint);

CREATE INDEX idx_api_performance_endpoint ON platform_admin.api_performance_log(endpoint, method);
CREATE INDEX idx_api_performance_timestamp ON platform_admin.api_performance_log(timestamp DESC);
CREATE INDEX idx_api_performance_status ON platform_admin.api_performance_log(status_code);

CREATE INDEX idx_resource_utilization_type_time ON platform_admin.resource_utilization(metric_type, timestamp DESC);

CREATE INDEX idx_performance_alerts_unack ON platform_admin.performance_alerts(acknowledged)
  WHERE acknowledged = FALSE;

-- RLS Policies
ALTER TABLE platform_admin.slow_query_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.api_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.api_performance_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.resource_utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view performance data"
  ON platform_admin.slow_query_log FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view API performance"
  ON platform_admin.api_performance_log FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view API performance hourly"
  ON platform_admin.api_performance_hourly FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view resource utilization"
  ON platform_admin.resource_utilization FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage performance alerts"
  ON platform_admin.performance_alerts FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Function to aggregate API performance hourly
CREATE OR REPLACE FUNCTION platform_admin.aggregate_api_performance_hourly()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO platform_admin.api_performance_hourly (
    endpoint,
    method,
    hour,
    request_count,
    avg_response_time_ms,
    p50_response_time_ms,
    p95_response_time_ms,
    p99_response_time_ms,
    error_count,
    success_count
  )
  SELECT
    endpoint,
    method,
    date_trunc('hour', timestamp) as hour,
    COUNT(*)::integer as request_count,
    AVG(response_time_ms)::integer as avg_response_time_ms,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms)::integer as p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::integer as p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms)::integer as p99,
    COUNT(*) FILTER (WHERE status_code >= 400)::integer as error_count,
    COUNT(*) FILTER (WHERE status_code < 400)::integer as success_count
  FROM platform_admin.api_performance_log
  WHERE timestamp >= NOW() - INTERVAL '2 hours'
    AND timestamp < date_trunc('hour', NOW())
  GROUP BY endpoint, method, date_trunc('hour', timestamp)
  ON CONFLICT (endpoint, method, hour)
  DO UPDATE SET
    request_count = EXCLUDED.request_count,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    p50_response_time_ms = EXCLUDED.p50_response_time_ms,
    p95_response_time_ms = EXCLUDED.p95_response_time_ms,
    p99_response_time_ms = EXCLUDED.p99_response_time_ms,
    error_count = EXCLUDED.error_count,
    success_count = EXCLUDED.success_count;
END;
$$;
