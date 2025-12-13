import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { days = 7, clear_existing = false } = await req.json().catch(() => ({}));

    console.log(`Generating seed data for ${days} days (clear_existing: ${clear_existing})`);

    // Get all active organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id')
      .eq('status', 'active')
      .limit(10);

    if (orgsError) throw orgsError;

    if (!organizations || organizations.length === 0) {
      throw new Error('No active organizations found');
    }

    // Clear existing data if requested
    if (clear_existing) {
      console.log('Clearing existing observability data...');
      await supabase.from('performance_metrics' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cost_attribution' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sla_violations' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const performanceMetrics: any[] = [];
    const costRecords: any[] = [];
    const slaViolations: any[] = [];

    // Generate data for each day
    for (let dayOffset = days; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);

      // Generate metrics for each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(date);
        timestamp.setHours(hour);

        for (const org of organizations) {
          // Performance metrics with realistic patterns
          const timeOfDay = hour / 24;
          const loadMultiplier = Math.sin(timeOfDay * Math.PI * 2) * 0.3 + 1; // Simulate daily load pattern
          
          // Query time metrics
          const baseQueryTime = 50 + Math.random() * 100;
          const queryTime = baseQueryTime * loadMultiplier;
          const queryTimes = Array.from({ length: 100 }, () => 
            queryTime + (Math.random() - 0.5) * 200
          ).sort((a, b) => a - b);

          performanceMetrics.push({
            organization_id: org.id,
            metric_type: 'query_time',
            value: queryTime,
            p50: queryTimes[50],
            p95: queryTimes[95],
            p99: queryTimes[99],
            timestamp: timestamp.toISOString(),
            metadata: { sample_size: 100, synthetic: true }
          });

          // CPU usage with spikes
          const cpuBase = 30 + Math.random() * 20;
          const cpuSpike = Math.random() < 0.05 ? 30 : 0; // 5% chance of spike
          performanceMetrics.push({
            organization_id: org.id,
            metric_type: 'cpu_usage',
            value: Math.min(95, cpuBase * loadMultiplier + cpuSpike),
            timestamp: timestamp.toISOString(),
            metadata: { synthetic: true }
          });

          // Memory usage - gradual growth
          const memoryBase = 40 + (dayOffset / days) * 20;
          performanceMetrics.push({
            organization_id: org.id,
            metric_type: 'memory_usage',
            value: Math.min(90, memoryBase + Math.random() * 10),
            timestamp: timestamp.toISOString(),
            metadata: { synthetic: true }
          });

          // IOPS
          performanceMetrics.push({
            organization_id: org.id,
            metric_type: 'iops',
            value: Math.floor(1000 + Math.random() * 4000 * loadMultiplier),
            timestamp: timestamp.toISOString(),
            metadata: { synthetic: true }
          });

          // Connection count
          performanceMetrics.push({
            organization_id: org.id,
            metric_type: 'connection_count',
            value: Math.floor(5 + Math.random() * 40 * loadMultiplier),
            timestamp: timestamp.toISOString(),
            metadata: { synthetic: true }
          });

          // Cache hit rate
          performanceMetrics.push({
            organization_id: org.id,
            metric_type: 'cache_hit_rate',
            value: 75 + Math.random() * 20,
            timestamp: timestamp.toISOString(),
            metadata: { synthetic: true }
          });

          // Generate SLA violations randomly (5% chance per hour)
          if (Math.random() < 0.05) {
            const violationStart = new Date(timestamp);
            const durationMinutes = Math.floor(Math.random() * 60) + 5;
            const violationEnd = new Date(violationStart.getTime() + durationMinutes * 60000);
            const resolved = dayOffset > 1 || Math.random() < 0.7; // Older violations more likely resolved

            const violationTypes = ['latency', 'uptime', 'response_time', 'error_rate', 'availability'];
            const severities = ['low', 'medium', 'high', 'critical'];
            const slaType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
            
            slaViolations.push({
              organization_id: org.id,
              sla_type: slaType,
              violation_start: violationStart.toISOString(),
              violation_end: resolved ? violationEnd.toISOString() : null,
              duration_seconds: resolved ? durationMinutes * 60 : null,
              severity: severities[Math.floor(Math.random() * severities.length)],
              threshold_value: slaType === 'latency' ? 500 : slaType === 'error_rate' ? 1 : 99,
              actual_value: slaType === 'latency' ? 750 + Math.random() * 500 : slaType === 'error_rate' ? 5 + Math.random() * 10 : 95 - Math.random() * 5,
              resolved,
              resolved_at: resolved ? violationEnd.toISOString() : null,
              details: { synthetic: true, cause: 'Simulated violation' }
            });
          }
        }
      }

      // Generate cost attribution for each billing period (daily granularity)
      const billingPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      for (const org of organizations) {
        const orgMultiplier = 0.7 + Math.random() * 0.6; // Organization size variation

        costRecords.push(
          {
            organization_id: org.id,
            cost_category: 'storage',
            amount_cents: Math.floor((1500 + Math.random() * 1000) * orgMultiplier),
            billing_period: billingPeriod,
            resource_breakdown: {
              database_storage_gb: (20 + Math.random() * 30) * orgMultiplier,
              file_storage_gb: (10 + Math.random() * 20) * orgMultiplier,
            },
            usage_quantity: (30 + Math.random() * 50) * orgMultiplier,
            unit_price_cents: 25,
          },
          {
            organization_id: org.id,
            cost_category: 'compute',
            amount_cents: Math.floor((800 + Math.random() * 600) * orgMultiplier),
            billing_period: billingPeriod,
            resource_breakdown: {
              query_time_hours: (15 + Math.random() * 20) * orgMultiplier,
              background_jobs_hours: (3 + Math.random() * 7) * orgMultiplier,
            },
            usage_quantity: (18 + Math.random() * 27) * orgMultiplier,
            unit_price_cents: 10,
          },
          {
            organization_id: org.id,
            cost_category: 'bandwidth',
            amount_cents: Math.floor((600 + Math.random() * 400) * orgMultiplier),
            billing_period: billingPeriod,
            resource_breakdown: {
              data_transfer_out_gb: (40 + Math.random() * 60) * orgMultiplier,
              data_transfer_in_gb: (30 + Math.random() * 40) * orgMultiplier,
            },
            usage_quantity: (70 + Math.random() * 100) * orgMultiplier,
            unit_price_cents: 12,
          },
          {
            organization_id: org.id,
            cost_category: 'ai_usage',
            amount_cents: Math.floor((200 + Math.random() * 300) * orgMultiplier),
            billing_period: billingPeriod,
            resource_breakdown: {
              total_tokens: Math.floor((20000 + Math.random() * 30000) * orgMultiplier),
              ai_executions: Math.floor((50 + Math.random() * 100) * orgMultiplier),
            },
            usage_quantity: (20 + Math.random() * 30) * orgMultiplier,
            unit_price_cents: 2,
          },
          {
            organization_id: org.id,
            cost_category: 'api_calls',
            amount_cents: Math.floor((300 + Math.random() * 200) * orgMultiplier),
            billing_period: billingPeriod,
            resource_breakdown: {
              total_calls: Math.floor((25000 + Math.random() * 25000) * orgMultiplier),
              read_calls: Math.floor((17500 + Math.random() * 17500) * orgMultiplier),
              write_calls: Math.floor((7500 + Math.random() * 7500) * orgMultiplier),
            },
            usage_quantity: (25 + Math.random() * 25) * orgMultiplier,
            unit_price_cents: 1,
          },
          {
            organization_id: org.id,
            cost_category: 'edge_functions',
            amount_cents: Math.floor((150 + Math.random() * 150) * orgMultiplier),
            billing_period: billingPeriod,
            resource_breakdown: {
              total_invocations: Math.floor((5000 + Math.random() * 5000) * orgMultiplier),
              avg_duration_ms: Math.floor(150 + Math.random() * 200),
            },
            usage_quantity: (5 + Math.random() * 5) * orgMultiplier,
            unit_price_cents: 2,
          }
        );
      }
    }

    // Insert data in batches
    console.log(`Inserting ${performanceMetrics.length} performance metrics...`);
    const batchSize = 1000;
    for (let i = 0; i < performanceMetrics.length; i += batchSize) {
      const batch = performanceMetrics.slice(i, i + batchSize);
      const { error } = await supabase.from('performance_metrics' as any).insert(batch);
      if (error) {
        console.error(`Error inserting metrics batch ${i}:`, error);
        throw error;
      }
    }

    console.log(`Inserting ${costRecords.length} cost records...`);
    for (let i = 0; i < costRecords.length; i += batchSize) {
      const batch = costRecords.slice(i, i + batchSize);
      const { error } = await supabase.from('cost_attribution' as any).insert(batch);
      if (error) {
        console.error(`Error inserting cost batch ${i}:`, error);
        throw error;
      }
    }

    console.log(`Inserting ${slaViolations.length} SLA violations...`);
    if (slaViolations.length > 0) {
      for (let i = 0; i < slaViolations.length; i += batchSize) {
        const batch = slaViolations.slice(i, i + batchSize);
        const { error } = await supabase.from('sla_violations' as any).insert(batch);
        if (error) {
          console.error(`Error inserting violations batch ${i}:`, error);
          throw error;
        }
      }
    }

    console.log('Seed data generation complete!');

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          days_generated: days,
          organizations: organizations.length,
          performance_metrics: performanceMetrics.length,
          cost_records: costRecords.length,
          sla_violations: slaViolations.length,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-observability-seed-data:', error);
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
