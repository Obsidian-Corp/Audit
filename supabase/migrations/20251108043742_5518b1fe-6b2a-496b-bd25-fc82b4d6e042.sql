-- Drop existing tables if they exist
DROP TABLE IF EXISTS platform_admin.performance_metrics CASCADE;
DROP TABLE IF EXISTS platform_admin.cost_attribution CASCADE;
DROP TABLE IF EXISTS platform_admin.sla_violations CASCADE;

-- Create performance_metrics table for comprehensive metrics collection
CREATE TABLE platform_admin.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('query_time', 'cpu_usage', 'memory_usage', 'iops', 'connection_count', 'cache_hit_rate')),
  value NUMERIC NOT NULL,
  p50 NUMERIC,
  p95 NUMERIC,
  p99 NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_performance_metrics_org_time ON platform_admin.performance_metrics(organization_id, timestamp DESC);
CREATE INDEX idx_performance_metrics_type_time ON platform_admin.performance_metrics(metric_type, timestamp DESC);
CREATE INDEX idx_performance_metrics_timestamp ON platform_admin.performance_metrics(timestamp DESC);

-- Create cost_attribution table for billing and cost tracking
CREATE TABLE platform_admin.cost_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  cost_category TEXT NOT NULL CHECK (cost_category IN ('storage', 'compute', 'bandwidth', 'ai_usage', 'api_calls', 'edge_functions')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  billing_period DATE NOT NULL,
  resource_breakdown JSONB DEFAULT '{}'::jsonb,
  usage_quantity NUMERIC,
  unit_price_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for cost queries
CREATE INDEX idx_cost_attribution_org_period ON platform_admin.cost_attribution(organization_id, billing_period DESC);
CREATE INDEX idx_cost_attribution_category ON platform_admin.cost_attribution(cost_category, billing_period DESC);
CREATE INDEX idx_cost_attribution_period ON platform_admin.cost_attribution(billing_period DESC);

-- Create sla_violations table for SLA monitoring
CREATE TABLE platform_admin.sla_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  sla_type TEXT NOT NULL CHECK (sla_type IN ('uptime', 'latency', 'availability', 'response_time', 'error_rate')),
  violation_start TIMESTAMP WITH TIME ZONE NOT NULL,
  violation_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  threshold_value NUMERIC,
  actual_value NUMERIC,
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for SLA queries
CREATE INDEX idx_sla_violations_org_time ON platform_admin.sla_violations(organization_id, violation_start DESC);
CREATE INDEX idx_sla_violations_type ON platform_admin.sla_violations(sla_type, violation_start DESC);
CREATE INDEX idx_sla_violations_severity ON platform_admin.sla_violations(severity, violation_start DESC);
CREATE INDEX idx_sla_violations_unresolved ON platform_admin.sla_violations(organization_id, resolved) WHERE resolved = false;

-- Enable RLS on new tables
ALTER TABLE platform_admin.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.cost_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.sla_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_metrics
CREATE POLICY "Platform admins can view performance metrics"
  ON platform_admin.performance_metrics
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "System can insert performance metrics"
  ON platform_admin.performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for cost_attribution
CREATE POLICY "Platform admins can view cost attribution"
  ON platform_admin.cost_attribution
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "System can manage cost attribution"
  ON platform_admin.cost_attribution
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sla_violations
CREATE POLICY "Platform admins can view SLA violations"
  ON platform_admin.sla_violations
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update SLA violations"
  ON platform_admin.sla_violations
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "System can insert SLA violations"
  ON platform_admin.sla_violations
  FOR INSERT
  WITH CHECK (true);

-- Function to calculate duration when violation ends
CREATE OR REPLACE FUNCTION platform_admin.calculate_sla_violation_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.violation_end IS NOT NULL AND (OLD IS NULL OR OLD.violation_end IS NULL OR OLD.violation_end != NEW.violation_end) THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.violation_end - NEW.violation_start))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-calculate duration
CREATE TRIGGER calculate_sla_duration
  BEFORE UPDATE ON platform_admin.sla_violations
  FOR EACH ROW
  EXECUTE FUNCTION platform_admin.calculate_sla_violation_duration();

-- Function to get performance summary
CREATE OR REPLACE FUNCTION public.get_performance_summary(
  _org_id UUID DEFAULT NULL,
  _hours_back INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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