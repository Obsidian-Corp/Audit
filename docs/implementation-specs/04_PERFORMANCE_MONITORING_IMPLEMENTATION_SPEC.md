# Performance Monitoring - Implementation Specification

**Module**: Performance Monitoring
**Priority**: MEDIUM
**Estimated Effort**: 1 week
**Status**: NOT STARTED

---

## Technical Architecture

### Database Schema

#### Step 1: Create Performance Monitoring Tables

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_performance_monitoring.sql`

```sql
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

CREATE POLICY "Platform admins view resource utilization"
  ON platform_admin.resource_utilization FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage performance alerts"
  ON platform_admin.performance_alerts FOR ALL
  USING (public.is_platform_admin(auth.uid()));
```

#### Step 2: Create Aggregation Function

```sql
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
```

---

## Edge Functions

### Step 3: Performance Collection Function

#### Function: collect-performance-metrics

**File**: `supabase/functions/collect-performance-metrics/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Collect database size
    const { data: dbSize } = await supabase.rpc('pg_database_size', {
      db_name: 'postgres'
    });

    await supabase
      .from('resource_utilization')
      .insert({
        metric_type: 'database_size',
        value: dbSize,
        metadata: { unit: 'bytes' },
      });

    // Collect connection count
    const { data: connections } = await supabase.rpc('pg_stat_activity_count');

    await supabase
      .from('resource_utilization')
      .insert({
        metric_type: 'connection_count',
        value: connections,
      });

    // Aggregate hourly API performance
    await supabase.rpc('aggregate_api_performance_hourly');

    // Check for performance alerts
    await checkPerformanceAlerts(supabase);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function checkPerformanceAlerts(supabase: any) {
  // Check for slow queries (> 2 seconds)
  const { data: slowQueries } = await supabase
    .from('slow_query_log')
    .select('*')
    .gte('execution_time_ms', 2000)
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .limit(10);

  if (slowQueries && slowQueries.length > 5) {
    await supabase
      .from('performance_alerts')
      .insert({
        alert_type: 'slow_query',
        severity: 'high',
        message: `${slowQueries.length} slow queries detected in the last hour`,
        details: { queries: slowQueries },
      });
  }

  // Check for high error rate
  const { data: errorRate } = await supabase
    .from('api_performance_hourly')
    .select('*')
    .gte('hour', new Date(Date.now() - 3600000).toISOString())
    .order('hour', { ascending: false })
    .limit(1)
    .single();

  if (errorRate && errorRate.request_count > 0) {
    const errorPercentage = (errorRate.error_count / errorRate.request_count) * 100;
    if (errorPercentage > 5) {
      await supabase
        .from('performance_alerts')
        .insert({
          alert_type: 'high_error_rate',
          severity: 'critical',
          message: `Error rate is ${errorPercentage.toFixed(2)}% (threshold: 5%)`,
          details: { error_rate: errorPercentage, data: errorRate },
        });
    }
  }
}
```

---

## Frontend Components

### Step 4: Performance Dashboards

#### Component 1: Slow Query Dashboard

**File**: `src/components/platform-admin/SlowQueryDashboard.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function SlowQueryDashboard() {
  const { data: slowQueries, isLoading } = useQuery({
    queryKey: ['slow-queries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slow_query_log')
        .select('*')
        .order('execution_time_ms', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const getSeverity = (timeMs: number) => {
    if (timeMs > 5000) return { label: 'Critical', variant: 'destructive' as const };
    if (timeMs > 2000) return { label: 'High', variant: 'default' as const };
    if (timeMs > 1000) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  if (isLoading) {
    return <div>Loading slow queries...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Slow Queries (>500ms)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Time (ms)</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slowQueries?.map((query) => {
              const severity = getSeverity(query.execution_time_ms);
              return (
                <TableRow key={query.id}>
                  <TableCell className="font-mono text-sm max-w-md truncate">
                    {query.query_text}
                  </TableCell>
                  <TableCell className="font-bold">
                    {query.execution_time_ms.toLocaleString()}ms
                  </TableCell>
                  <TableCell className="text-sm">{query.endpoint || 'N/A'}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(query.timestamp), 'PPp')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severity.variant}>{severity.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

#### Component 2: API Performance Dashboard

**File**: `src/components/platform-admin/APIPerformanceDashboard.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

export function APIPerformanceDashboard() {
  const { data: performance, isLoading } = useQuery({
    queryKey: ['api-performance-hourly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_performance_hourly')
        .select('*')
        .gte('hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('hour', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Group by endpoint for summary
  const endpointSummary = performance?.reduce((acc: any[], curr) => {
    const existing = acc.find(e => e.endpoint === curr.endpoint && e.method === curr.method);
    if (existing) {
      existing.total_requests += curr.request_count;
      existing.avg_response_time = (existing.avg_response_time + curr.avg_response_time_ms) / 2;
      existing.error_count += curr.error_count;
    } else {
      acc.push({
        endpoint: curr.endpoint,
        method: curr.method,
        total_requests: curr.request_count,
        avg_response_time: curr.avg_response_time_ms,
        p95: curr.p95_response_time_ms,
        p99: curr.p99_response_time_ms,
        error_count: curr.error_count,
      });
    }
    return acc;
  }, []);

  const getHealthStatus = (avgTime: number, errorCount: number, totalRequests: number) => {
    const errorRate = (errorCount / totalRequests) * 100;
    if (avgTime > 1000 || errorRate > 5) return { icon: <AlertCircle className="h-4 w-4 text-red-600" />, color: 'text-red-600' };
    if (avgTime > 500 || errorRate > 2) return { icon: <TrendingUp className="h-4 w-4 text-amber-600" />, color: 'text-amber-600' };
    return { icon: <Activity className="h-4 w-4 text-green-600" />, color: 'text-green-600' };
  };

  if (isLoading) {
    return <div>Loading API performance...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Performance (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>P95</TableHead>
                <TableHead>P99</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpointSummary?.map((endpoint, idx) => {
                const health = getHealthStatus(endpoint.avg_response_time, endpoint.error_count, endpoint.total_requests);
                const errorRate = ((endpoint.error_count / endpoint.total_requests) * 100).toFixed(2);

                return (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{endpoint.method}</Badge>
                    </TableCell>
                    <TableCell>{endpoint.total_requests.toLocaleString()}</TableCell>
                    <TableCell>{endpoint.avg_response_time.toFixed(0)}ms</TableCell>
                    <TableCell>{endpoint.p95}ms</TableCell>
                    <TableCell>{endpoint.p99}ms</TableCell>
                    <TableCell>
                      {endpoint.error_count} ({errorRate}%)
                    </TableCell>
                    <TableCell>{health.icon}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="p50_response_time_ms" stroke="#8884d8" name="P50" />
              <Line type="monotone" dataKey="p95_response_time_ms" stroke="#82ca9d" name="P95" />
              <Line type="monotone" dataKey="p99_response_time_ms" stroke="#ffc658" name="P99" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Database (Days 1-2)
- [ ] Create performance monitoring migration
- [ ] Create aggregation functions
- [ ] Test slow query capture

### Phase 2: Collection (Days 3-4)
- [ ] Create collect-performance-metrics function
- [ ] Set up scheduled collection (hourly)
- [ ] Test alert generation

### Phase 3: Dashboards (Days 5-7)
- [ ] SlowQueryDashboard component
- [ ] APIPerformanceDashboard component
- [ ] Performance alerts panel
- [ ] Add to admin dashboard

---

## Success Criteria

- [ ] Slow queries (>500ms) logged automatically
- [ ] API performance tracked by endpoint
- [ ] Hourly aggregates calculated
- [ ] Performance alerts trigger
- [ ] Dashboards show real-time data
