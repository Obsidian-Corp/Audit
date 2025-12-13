import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface HealthAlert {
  organization_id: string;
  organization_name: string;
  health_score: number;
  alerts: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled health check...');

    // Fetch all active organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('status', 'active');

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      throw orgsError;
    }

    console.log(`Found ${organizations?.length || 0} organizations to check`);

    const criticalAlerts: HealthAlert[] = [];
    const warningAlerts: HealthAlert[] = [];

    // Process each organization
    for (const org of organizations || []) {
      try {
        console.log(`Analyzing health for organization: ${org.name} (${org.id})`);

        // Call the analyze-org-health function
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
          'analyze-org-health',
          {
            body: { organizationId: org.id }
          }
        );

        if (analysisError) {
          console.error(`Error analyzing org ${org.id}:`, analysisError);
          continue;
        }

        const analysis = analysisResult?.analysis;
        if (!analysis) continue;

        // Record health score snapshot
        const { error: snapshotError } = await supabase.rpc('record_health_score_snapshot', {
          _organization_id: org.id,
          _health_score: analysis.overallScore || 0,
          _factors: analysis.factors || {},
          _issues: analysis.concerns || []
        });

        if (snapshotError) {
          console.error(`Error recording snapshot for org ${org.id}:`, snapshotError);
        }

        // Check thresholds and collect alerts
        const healthScore = analysis.overallScore || 0;
        const hasAlerts = analysisResult.alerts && analysisResult.alerts.length > 0;

        if (healthScore < 60 || hasAlerts) {
          const orgAlert: HealthAlert = {
            organization_id: org.id,
            organization_name: org.name,
            health_score: healthScore,
            alerts: analysisResult.alerts || []
          };

          if (healthScore < 50 || analysisResult.alerts?.some((a: any) => a.severity === 'critical')) {
            criticalAlerts.push(orgAlert);
          } else {
            warningAlerts.push(orgAlert);
          }
        }

        console.log(`Completed health check for ${org.name}: Score ${healthScore}`);

      } catch (error) {
        console.error(`Error processing organization ${org.id}:`, error);
      }
    }

    // Send email notifications to platform admins if there are alerts
    if (criticalAlerts.length > 0 || warningAlerts.length > 0) {
      await sendHealthAlertEmails(criticalAlerts, warningAlerts);
    }

    const summary = {
      timestamp: new Date().toISOString(),
      organizations_checked: organizations?.length || 0,
      critical_alerts: criticalAlerts.length,
      warning_alerts: warningAlerts.length,
      status: 'completed'
    };

    console.log('Health check completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in scheduled health check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function sendHealthAlertEmails(
  criticalAlerts: HealthAlert[],
  warningAlerts: HealthAlert[]
) {
  try {
    // Fetch platform admin emails
    const { data: admins, error: adminsError } = await supabase
      .from('admin_roles')
      .select('user_id, profiles!inner(email, full_name)')
      .eq('role', 'platform_admin')
      .or('expires_at.is.null,expires_at.gt.now()');

    if (adminsError) {
      console.error('Error fetching platform admins:', adminsError);
      return;
    }

    const adminEmails = admins?.map((admin: any) => admin.profiles.email).filter(Boolean) || [];

    if (adminEmails.length === 0) {
      console.log('No platform admin emails found');
      return;
    }

    console.log(`Sending health alerts to ${adminEmails.length} platform admins`);

    // Generate email HTML
    const emailHtml = generateHealthAlertEmail(criticalAlerts, warningAlerts);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Platform Health <onboarding@resend.dev>',
      to: adminEmails,
      subject: `Platform Health Alert - ${criticalAlerts.length} Critical, ${warningAlerts.length} Warnings`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending health alert email:', error);
    } else {
      console.log('Health alert email sent successfully:', data);
    }

  } catch (error) {
    console.error('Error in sendHealthAlertEmails:', error);
  }
}

function generateHealthAlertEmail(
  criticalAlerts: HealthAlert[],
  warningAlerts: HealthAlert[]
): string {
  const timestamp = new Date().toLocaleString();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-section { margin-bottom: 30px; }
        .alert-card { background: white; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .alert-card.warning { border-left-color: #f59e0b; }
        .alert-title { font-weight: 600; font-size: 18px; margin-bottom: 10px; }
        .health-score { display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px; }
        .health-score.critical { background: #fee2e2; color: #991b1b; }
        .health-score.warning { background: #fef3c7; color: #92400e; }
        .alert-item { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 4px; }
        .alert-type { font-weight: 600; color: #4b5563; }
        .alert-desc { color: #6b7280; margin-top: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Platform Health Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Automated health check completed at ${timestamp}</p>
        </div>
        <div class="content">
  `;

  if (criticalAlerts.length > 0) {
    html += `
      <div class="alert-section">
        <h2 style="color: #ef4444; margin-bottom: 15px;">⚠️ Critical Alerts (${criticalAlerts.length})</h2>
    `;

    criticalAlerts.forEach(alert => {
      html += `
        <div class="alert-card">
          <div class="alert-title">
            ${alert.organization_name}
            <span class="health-score critical">Health Score: ${alert.health_score}%</span>
          </div>
      `;

      alert.alerts.forEach(item => {
        html += `
          <div class="alert-item">
            <div class="alert-type">${item.type}</div>
            <div class="alert-desc">${item.description}</div>
            <div style="color: #059669; margin-top: 5px; font-size: 14px;">💡 ${item.recommendation}</div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `</div>`;
  }

  if (warningAlerts.length > 0) {
    html += `
      <div class="alert-section">
        <h2 style="color: #f59e0b; margin-bottom: 15px;">⚡ Warning Alerts (${warningAlerts.length})</h2>
    `;

    warningAlerts.forEach(alert => {
      html += `
        <div class="alert-card warning">
          <div class="alert-title">
            ${alert.organization_name}
            <span class="health-score warning">Health Score: ${alert.health_score}%</span>
          </div>
      `;

      alert.alerts.forEach(item => {
        html += `
          <div class="alert-item">
            <div class="alert-type">${item.type}</div>
            <div class="alert-desc">${item.description}</div>
            <div style="color: #059669; margin-top: 5px; font-size: 14px;">💡 ${item.recommendation}</div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `</div>`;
  }

  html += `
          <div class="footer">
            <p>This is an automated health check notification from your Platform Admin System.</p>
            <p>Please review the alerts and take appropriate action.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
