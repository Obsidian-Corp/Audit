import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceMetric {
  organization_id: string | null;
  metric_type: 'query_time' | 'cpu_usage' | 'memory_usage' | 'iops' | 'connection_count' | 'cache_hit_rate';
  value: number;
  p50?: number;
  p95?: number;
  p99?: number;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting metrics collection...');

    // Get all organizations to collect metrics per org
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id')
      .eq('status', 'active');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      throw orgsError;
    }

    const metrics: PerformanceMetric[] = [];
    const timestamp = new Date().toISOString();

    // Simulate collecting metrics (in production, these would come from actual monitoring)
    // For now, generate sample data
    for (const org of organizations || []) {
      // Query time metrics
      const queryTimes = Array.from({ length: 100 }, () => Math.random() * 500 + 50);
      queryTimes.sort((a, b) => a - b);
      
      metrics.push({
        organization_id: org.id,
        metric_type: 'query_time',
        value: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
        p50: queryTimes[Math.floor(queryTimes.length * 0.5)],
        p95: queryTimes[Math.floor(queryTimes.length * 0.95)],
        p99: queryTimes[Math.floor(queryTimes.length * 0.99)],
        metadata: { sample_size: queryTimes.length, timestamp }
      });

      // CPU usage
      metrics.push({
        organization_id: org.id,
        metric_type: 'cpu_usage',
        value: Math.random() * 80 + 10, // 10-90%
        metadata: { timestamp }
      });

      // Memory usage
      metrics.push({
        organization_id: org.id,
        metric_type: 'memory_usage',
        value: Math.random() * 70 + 20, // 20-90%
        metadata: { timestamp }
      });

      // IOPS
      metrics.push({
        organization_id: org.id,
        metric_type: 'iops',
        value: Math.floor(Math.random() * 5000 + 1000), // 1000-6000
        metadata: { timestamp }
      });

      // Connection count
      metrics.push({
        organization_id: org.id,
        metric_type: 'connection_count',
        value: Math.floor(Math.random() * 50 + 5), // 5-55
        metadata: { timestamp }
      });

      // Cache hit rate
      metrics.push({
        organization_id: org.id,
        metric_type: 'cache_hit_rate',
        value: Math.random() * 30 + 70, // 70-100%
        metadata: { timestamp }
      });
    }

    // Insert metrics into database
    const { error: insertError } = await supabase
      .from('performance_metrics')
      .insert(metrics);

    if (insertError) {
      console.error('Error inserting metrics:', insertError);
      throw insertError;
    }

    console.log(`Successfully collected ${metrics.length} metrics for ${organizations?.length} organizations`);

    return new Response(
      JSON.stringify({
        success: true,
        metrics_collected: metrics.length,
        organizations: organizations?.length,
        timestamp
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in collect-metrics function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
