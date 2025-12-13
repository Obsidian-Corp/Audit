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

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        function: 'generate-compliance-report',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { framework, startDate, endDate } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get comprehensive data for compliance report
    const [
      accessLogs,
      boundaryLogs,
      failedAuth,
      anomalies,
      slaViolations,
    ] = await Promise.all([
      supabase
        .from('platform_admin.access_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('platform_admin.schema_boundary_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('platform_admin.failed_auth_attempts')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('platform_admin.anomaly_alerts')
        .select('*')
        .gte('detected_at', startDate)
        .lte('detected_at', endDate),
      supabase
        .from('platform_admin.sla_violations')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
    ]);

    // Build compliance data structure
    const complianceData = {
      framework,
      period: { start: startDate, end: endDate },
      summary: {
        total_access_events: accessLogs.data?.length || 0,
        boundary_requests: boundaryLogs.data?.length || 0,
        approved_requests: boundaryLogs.data?.filter((r: any) => r.approved).length || 0,
        denied_requests: boundaryLogs.data?.filter((r: any) => !r.approved && r.approved_by).length || 0,
        failed_auth_attempts: failedAuth.data?.length || 0,
        anomalies_detected: anomalies.data?.length || 0,
        sla_violations: slaViolations.data?.length || 0,
      },
      sections: generateSections(framework, {
        accessLogs: accessLogs.data,
        boundaryLogs: boundaryLogs.data,
        failedAuth: failedAuth.data,
        anomalies: anomalies.data,
        slaViolations: slaViolations.data,
      }),
      generated_at: new Date().toISOString(),
    };

    // Generate CSV format
    const csv = generateCSV(complianceData);

    // Store export record
    const { data: user } = await supabase.auth.getUser();
    await supabase
      .from('platform_admin.compliance_exports')
      .insert({
        export_type: 'csv',
        framework,
        start_date: startDate,
        end_date: endDate,
        file_size_bytes: csv.length,
        generated_by: user.user?.id,
        metadata: complianceData.summary,
      });

    return new Response(
      JSON.stringify({
        report: complianceData,
        csv,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateSections(framework: string, data: any) {
  const sections: any = {};

  if (framework === 'SOC2') {
    sections['Access Control'] = {
      description: 'Access control logs and authorization events',
      findings: `${data.accessLogs?.length || 0} access events recorded`,
      controls: [
        'Multi-factor authentication enforced for platform admins',
        'Role-based access control implemented',
        'Schema boundary protections active',
      ],
    };

    sections['Change Management'] = {
      description: 'Changes to system configuration and data access policies',
      findings: `${data.boundaryLogs?.length || 0} boundary requests processed`,
      controls: [
        'All schema boundary crossings require approval',
        'Audit trail maintained for all decisions',
        'SLA monitoring active',
      ],
    };

    sections['Monitoring'] = {
      description: 'Security monitoring and incident response',
      findings: `${data.anomalies?.length || 0} anomalies detected`,
      controls: [
        'Automated anomaly detection active',
        'Real-time alerting configured',
        'Failed authentication tracking enabled',
      ],
    };
  }

  return sections;
}

function generateCSV(data: any): string {
  let csv = 'Compliance Report\n\n';
  csv += `Framework,${data.framework}\n`;
  csv += `Period,${data.period.start} to ${data.period.end}\n`;
  csv += `Generated,${data.generated_at}\n\n`;

  csv += 'Summary\n';
  csv += 'Metric,Value\n';
  Object.entries(data.summary).forEach(([key, value]) => {
    csv += `${key.replace(/_/g, ' ')},${value}\n`;
  });

  csv += '\n\nSections\n';
  Object.entries(data.sections).forEach(([section, details]: [string, any]) => {
    csv += `\n${section}\n`;
    csv += `Description,${details.description}\n`;
    csv += `Findings,${details.findings}\n`;
    csv += 'Controls:\n';
    details.controls.forEach((control: string) => {
      csv += `,"${control}"\n`;
    });
  });

  return csv;
}
