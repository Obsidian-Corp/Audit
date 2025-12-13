import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

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
        function: 'detect-anomalies',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get activity from last 24 hours
    const { data: recentActivity } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get historical baseline (30 days)
    const { data: historicalActivity } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!recentActivity || !historicalActivity) {
      return new Response(
        JSON.stringify({ anomalies: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const avgDailyRequests = historicalActivity.length / 30;
    const recentRequestCount = recentActivity.length;

    // Check for volume anomalies
    const anomalies: any[] = [];

    if (recentRequestCount > avgDailyRequests * 3) {
      anomalies.push({
        anomaly_type: 'volume_spike',
        severity: 'high',
        description: `Unusual spike in boundary requests: ${recentRequestCount} requests (300% above baseline of ${avgDailyRequests.toFixed(0)})`,
        metadata: {
          recent_count: recentRequestCount,
          baseline: avgDailyRequests,
          spike_factor: (recentRequestCount / avgDailyRequests).toFixed(2),
        },
      });
    }

    // Check for unusual users
    const recentUsers = new Set(recentActivity.map((r: any) => r.user_id));
    const historicalUsers = new Set(historicalActivity.map((r: any) => r.user_id));
    
    recentUsers.forEach((userId) => {
      if (!historicalUsers.has(userId)) {
        const userRequests = recentActivity.filter((r: any) => r.user_id === userId);
        anomalies.push({
          anomaly_type: 'new_user_activity',
          severity: 'medium',
          description: `New user making boundary requests: ${userRequests.length} requests in 24h`,
          affected_user_id: userId,
          metadata: {
            request_count: userRequests.length,
            classifications: userRequests.map((r: any) => r.data_classification),
          },
        });
      }
    });

    // Check for highly restricted data access
    const highlyRestrictedAccess = recentActivity.filter(
      (r: any) => r.data_classification === 'highly_restricted'
    );

    if (highlyRestrictedAccess.length > 5) {
      anomalies.push({
        anomaly_type: 'sensitive_data_spike',
        severity: 'critical',
        description: `High volume of highly restricted data access attempts: ${highlyRestrictedAccess.length} in 24h`,
        metadata: {
          count: highlyRestrictedAccess.length,
          users: [...new Set(highlyRestrictedAccess.map((r: any) => r.user_id))],
        },
      });
    }

    // Insert anomalies into database
    if (anomalies.length > 0) {
      await supabase
        .from('platform_admin.anomaly_alerts')
        .insert(anomalies);

      // Send email notifications to platform admins
      const criticalCount = anomalies.filter((a: any) => a.severity === 'critical').length;
      const highCount = anomalies.filter((a: any) => a.severity === 'high').length;

      if (criticalCount > 0 || highCount > 0) {
        try {
          // Get platform admins
          const { data: admins } = await supabase.rpc('get_platform_admin_roles');
          
          if (admins && admins.length > 0) {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
              const resend = new Resend(resendApiKey);
              const adminEmails = admins.map((admin: any) => admin.email).filter(Boolean);
              const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
              
              const emailContent = generateAnomalyEmailContent(anomalies, supabaseUrl);
              
              await resend.emails.send({
                from: 'Obsidian Platform Admin <onboarding@resend.dev>',
                to: adminEmails,
                subject: emailContent.subject,
                html: emailContent.html,
              });

              console.log(`Anomaly alert email sent to ${adminEmails.length} admins`);
            }
          }
        } catch (emailError) {
          console.error('Error sending anomaly alert email:', emailError);
          // Continue execution even if email fails
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        anomalies,
        summary: {
          total: anomalies.length,
          critical: anomalies.filter((a: any) => a.severity === 'critical').length,
          high: anomalies.filter((a: any) => a.severity === 'high').length,
          medium: anomalies.filter((a: any) => a.severity === 'medium').length,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateAnomalyEmailContent(anomalies: any[], supabaseUrl: string): { subject: string; html: string } {
  const platformAdminUrl = supabaseUrl.replace('.supabase.co', '') + '/platform-admin';
  
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  const highAnomalies = anomalies.filter(a => a.severity === 'high');
  const mediumAnomalies = anomalies.filter(a => a.severity === 'medium');

  const subject = criticalAnomalies.length > 0 
    ? '🚨 Critical Security Anomalies Detected'
    : '⚠️ Security Anomalies Detected';

  const anomalyItems = anomalies.map(anomaly => `
    <div style="margin: 16px 0; padding: 16px; border-left: 4px solid ${
      anomaly.severity === 'critical' ? '#dc2626' : 
      anomaly.severity === 'high' ? '#ea580c' : '#f59e0b'
    }; background: ${
      anomaly.severity === 'critical' ? '#fef2f2' : 
      anomaly.severity === 'high' ? '#fff7ed' : '#fffbeb'
    }; border-radius: 4px;">
      <div style="font-weight: 600; color: ${
        anomaly.severity === 'critical' ? '#dc2626' : 
        anomaly.severity === 'high' ? '#ea580c' : '#f59e0b'
      }; text-transform: uppercase; font-size: 12px; margin-bottom: 8px;">
        ${anomaly.severity} Severity
      </div>
      <div style="font-weight: 500; margin-bottom: 8px;">${anomaly.anomaly_type.replace(/_/g, ' ').toUpperCase()}</div>
      <div style="color: #6b7280; font-size: 14px;">${anomaly.description}</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .summary { display: flex; gap: 16px; margin: 20px 0; }
          .summary-item { flex: 1; background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
          .summary-number { font-size: 32px; font-weight: bold; margin: 8px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🚨 Security Anomalies Detected</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Unusual Activity Requires Your Attention</p>
          </div>
          <div class="content">
            <p style="margin: 0 0 20px 0;">The automated anomaly detection system has identified suspicious activity on the platform in the last 24 hours.</p>
            
            <div class="summary">
              ${criticalAnomalies.length > 0 ? `
                <div class="summary-item">
                  <div style="color: #dc2626; font-size: 12px; text-transform: uppercase; font-weight: 600;">Critical</div>
                  <div class="summary-number" style="color: #dc2626;">${criticalAnomalies.length}</div>
                </div>
              ` : ''}
              ${highAnomalies.length > 0 ? `
                <div class="summary-item">
                  <div style="color: #ea580c; font-size: 12px; text-transform: uppercase; font-weight: 600;">High</div>
                  <div class="summary-number" style="color: #ea580c;">${highAnomalies.length}</div>
                </div>
              ` : ''}
              ${mediumAnomalies.length > 0 ? `
                <div class="summary-item">
                  <div style="color: #f59e0b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Medium</div>
                  <div class="summary-number" style="color: #f59e0b;">${mediumAnomalies.length}</div>
                </div>
              ` : ''}
            </div>

            <h2 style="font-size: 18px; margin: 24px 0 16px 0;">Detected Anomalies</h2>
            ${anomalyItems}
            
            <p style="margin-top: 24px;"><strong>Recommended Actions:</strong></p>
            <ul style="color: #4b5563;">
              <li>Review the anomalies in the Platform Admin dashboard</li>
              <li>Investigate users and patterns associated with suspicious activity</li>
              <li>Take appropriate action on pending boundary requests</li>
              <li>Update security policies if necessary</li>
            </ul>
            
            <a href="${platformAdminUrl}" class="button">View Platform Admin Dashboard</a>
          </div>
          <div class="footer">
            <p>Obsidian Platform Administration</p>
            <p>This is an automated alert. Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}
