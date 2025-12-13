import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alert thresholds
const APPROVAL_RATE_THRESHOLD = 50; // Alert if approval rate drops below 50%
const PENDING_AGE_HOURS = 24; // Alert if requests pending for more than 24 hours

interface AlertData {
  type: 'low_approval_rate' | 'old_pending_requests';
  metrics: {
    approval_rate?: number;
    pending_count?: number;
    oldest_pending_hours?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        function: 'check-admin-alerts',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    console.log('Starting admin alerts check...');

    // Get platform admins
    const { data: admins, error: adminsError } = await supabase.rpc('get_platform_admin_roles');
    
    if (adminsError) {
      console.error('Error fetching platform admins:', adminsError);
      throw adminsError;
    }

    if (!admins || admins.length === 0) {
      console.log('No platform admins found');
      return new Response(
        JSON.stringify({ message: 'No platform admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${admins.length} platform admins`);

    // Get analytics for last 7 days
    const { data: analytics, error: analyticsError } = await supabase.rpc(
      'get_boundary_crossing_analytics',
      { days_back: 7 }
    );

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      throw analyticsError;
    }

    const alerts: AlertData[] = [];
    const summary = analytics?.summary || { approval_rate: 0, pending: 0 };

    // Check approval rate
    if (summary.approval_rate < APPROVAL_RATE_THRESHOLD && (summary.approved + summary.denied) > 0) {
      console.log(`Low approval rate detected: ${summary.approval_rate}%`);
      alerts.push({
        type: 'low_approval_rate',
        metrics: {
          approval_rate: summary.approval_rate,
        },
      });
    }

    // Check for old pending requests
    const { data: oldPending, error: pendingError } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('id, created_at, user_name, source_schema, target_schema, operation')
      .is('approved_by', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (!pendingError && oldPending && oldPending.length > 0) {
      const oldestRequest = oldPending[0];
      const hoursOld = (Date.now() - new Date(oldestRequest.created_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursOld > PENDING_AGE_HOURS) {
        console.log(`Old pending requests detected: ${hoursOld.toFixed(1)} hours`);
        alerts.push({
          type: 'old_pending_requests',
          metrics: {
            pending_count: summary.pending,
            oldest_pending_hours: Math.floor(hoursOld),
          },
        });
      }
    }

    // Send alerts if any
    if (alerts.length > 0) {
      console.log(`Sending ${alerts.length} alerts to ${admins.length} admins`);
      
      const adminEmails = admins.map((admin: any) => admin.email).filter(Boolean);
      
      for (const alert of alerts) {
        const emailContent = generateEmailContent(alert, supabaseUrl);
        
        const { error: emailError } = await resend.emails.send({
          from: 'Obsidian Platform Admin <onboarding@resend.dev>',
          to: adminEmails,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (emailError) {
          console.error('Error sending email:', emailError);
        } else {
          console.log(`Alert email sent: ${alert.type}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          alerts_sent: alerts.length,
          admins_notified: adminEmails.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('No alerts triggered');
    return new Response(
      JSON.stringify({ success: true, message: 'No alerts triggered' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in check-admin-alerts:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message ?? String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function generateEmailContent(alert: AlertData, supabaseUrl: string): { subject: string; html: string } {
  const platformAdminUrl = supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '') + '/platform-admin';

  if (alert.type === 'low_approval_rate') {
    return {
      subject: '⚠️ Low Schema Boundary Approval Rate Alert',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .metric { font-size: 32px; font-weight: bold; color: #ef4444; margin: 10px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⚠️ Schema Boundary Alert</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Low Approval Rate Detected</p>
              </div>
              <div class="content">
                <div class="alert-box">
                  <p style="margin: 0 0 10px 0; font-weight: 600;">Approval Rate Below Threshold</p>
                  <div class="metric">${alert.metrics.approval_rate?.toFixed(1)}%</div>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                    The schema boundary crossing approval rate has fallen below the ${APPROVAL_RATE_THRESHOLD}% threshold in the last 7 days.
                  </p>
                </div>
                
                <p>This could indicate:</p>
                <ul style="color: #4b5563;">
                  <li>Increased security concerns with boundary crossing requests</li>
                  <li>Need for policy review or clarification</li>
                  <li>Users attempting inappropriate cross-schema access</li>
                </ul>
                
                <p><strong>Recommended Actions:</strong></p>
                <ul style="color: #4b5563;">
                  <li>Review recent denied requests for patterns</li>
                  <li>Check if security policies need updating</li>
                  <li>Communicate with requesters about denial reasons</li>
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
      `,
    };
  } else {
    return {
      subject: '⏰ Old Pending Schema Boundary Requests Alert',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .metric { font-size: 32px; font-weight: bold; color: #d97706; margin: 10px 0; }
              .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⏰ Schema Boundary Alert</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Old Pending Requests Detected</p>
              </div>
              <div class="content">
                <div class="alert-box">
                  <p style="margin: 0 0 10px 0; font-weight: 600;">Pending Requests Require Attention</p>
                  <div class="metric">${alert.metrics.pending_count}</div>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                    There are ${alert.metrics.pending_count} pending schema boundary requests. The oldest has been waiting for <strong>${alert.metrics.oldest_pending_hours} hours</strong>.
                  </p>
                </div>
                
                <p>Delayed approvals can:</p>
                <ul style="color: #4b5563;">
                  <li>Block critical data access for users</li>
                  <li>Impact operational efficiency</li>
                  <li>Create bottlenecks in workflows</li>
                  <li>Frustrate users waiting for decisions</li>
                </ul>
                
                <p><strong>Recommended Actions:</strong></p>
                <ul style="color: #4b5563;">
                  <li>Review and process pending requests promptly</li>
                  <li>Assign additional approvers if needed</li>
                  <li>Set up approval delegation for coverage</li>
                </ul>
                
                <a href="${platformAdminUrl}" class="button">Review Pending Requests</a>
              </div>
              <div class="footer">
                <p>Obsidian Platform Administration</p>
                <p>This is an automated alert. Do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  }
}