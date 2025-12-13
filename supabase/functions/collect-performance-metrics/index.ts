import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting performance metrics collection...');

    // Collect database metrics (simplified since we don't have direct access to pg_database_size)
    // In a real implementation, you would query actual database metrics
    const metricsCollected = [];

    // Simulate database size collection
    try {
      await supabase
        .from('resource_utilization')
        .insert({
          metric_type: 'database_size',
          value: 0, // Would need actual metric from Supabase
          metadata: { unit: 'bytes', simulated: true },
        });
      metricsCollected.push('database_size');
    } catch (error) {
      console.error('Error collecting database size:', error);
    }

    // Collect connection count (simplified)
    try {
      await supabase
        .from('resource_utilization')
        .insert({
          metric_type: 'connection_count',
          value: 0, // Would need actual metric
          metadata: { simulated: true },
        });
      metricsCollected.push('connection_count');
    } catch (error) {
      console.error('Error collecting connection count:', error);
    }

    // Aggregate hourly API performance
    try {
      await supabase.rpc('aggregate_api_performance_hourly');
      metricsCollected.push('api_performance_hourly');
    } catch (error) {
      console.error('Error aggregating API performance:', error);
    }

    // Check for performance alerts
    await checkPerformanceAlerts(supabase);
    metricsCollected.push('performance_alerts_check');

    console.log('Performance metrics collection completed:', metricsCollected);

    return new Response(
      JSON.stringify({
        success: true,
        metrics_collected: metricsCollected,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Performance collection error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkPerformanceAlerts(supabase: any) {
  try {
    // Check for slow queries (> 2 seconds) in the last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: slowQueries, error: slowQueryError } = await supabase
      .from('slow_query_log')
      .select('*')
      .gte('execution_time_ms', 2000)
      .gte('timestamp', oneHourAgo)
      .limit(10);

    if (slowQueryError) {
      console.error('Error checking slow queries:', slowQueryError);
    } else if (slowQueries && slowQueries.length > 5) {
      // Create alert for multiple slow queries
      await supabase
        .from('performance_alerts')
        .insert({
          alert_type: 'slow_query',
          severity: 'high',
          message: `${slowQueries.length} slow queries detected in the last hour`,
          details: {
            query_count: slowQueries.length,
            queries: slowQueries.slice(0, 5),
          },
        });
    }

    // Check for high error rate (> 10% errors in last hour)
    const { data: errorRateData, error: errorRateError } = await supabase
      .from('api_performance_log')
      .select('status_code')
      .gte('timestamp', oneHourAgo);

    if (errorRateError) {
      console.error('Error checking error rate:', errorRateError);
    } else if (errorRateData && errorRateData.length > 100) {
      const errorCount = errorRateData.filter((r: any) => r.status_code >= 400).length;
      const errorRate = errorCount / errorRateData.length;

      if (errorRate > 0.1) {
        await supabase
          .from('performance_alerts')
          .insert({
            alert_type: 'high_error_rate',
            severity: 'critical',
            message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
            details: {
              error_rate: errorRate,
              total_requests: errorRateData.length,
              error_count: errorCount,
            },
          });
      }
    }

    // Check for resource thresholds (example: database size > 10GB)
    const { data: latestDbSize, error: dbSizeError } = await supabase
      .from('resource_utilization')
      .select('*')
      .eq('metric_type', 'database_size')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (dbSizeError) {
      console.error('Error checking database size:', dbSizeError);
    } else if (latestDbSize && latestDbSize.length > 0) {
      const dbSize = parseFloat(latestDbSize[0].value);
      const tenGB = 10 * 1024 * 1024 * 1024; // 10GB in bytes

      if (dbSize > tenGB) {
        await supabase
          .from('performance_alerts')
          .insert({
            alert_type: 'resource_threshold',
            severity: 'medium',
            message: `Database size exceeds 10GB: ${(dbSize / (1024 * 1024 * 1024)).toFixed(2)}GB`,
            details: {
              database_size_bytes: dbSize,
              threshold_bytes: tenGB,
            },
          });
      }
    }

    console.log('Performance alerts check completed');
  } catch (error) {
    console.error('Error in checkPerformanceAlerts:', error);
  }
}
