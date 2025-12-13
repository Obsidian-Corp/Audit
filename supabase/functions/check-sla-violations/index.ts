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
        function: 'check-sla-violations',
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

    // Get active SLA configs
    const { data: slaConfigs } = await supabase
      .from('platform_admin.sla_config')
      .select('*')
      .eq('is_active', true);

    if (!slaConfigs) {
      return new Response(
        JSON.stringify({ violations: [], message: 'No SLA configs found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all pending requests
    const { data: pendingRequests } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('*')
      .is('approved_by', null);

    const violations = [];
    const now = new Date();

    for (const request of pendingRequests || []) {
      const requestAge = (now.getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60); // hours
      
      // Find matching SLA config
      const slaConfig = slaConfigs.find(
        (config) => config.request_type === 'schema_boundary'
      );

      if (slaConfig && requestAge > slaConfig.response_time_hours) {
        // Check if violation already recorded
        const { data: existingViolation } = await supabase
          .from('platform_admin.sla_violations')
          .select('id')
          .eq('request_id', request.id)
          .single();

        if (!existingViolation) {
          const escalationChain = slaConfig.escalation_chain as any[];
          let escalationLevel = 0;

          // Determine escalation level based on age
          for (let i = 0; i < escalationChain.length; i++) {
            if (requestAge > escalationChain[i].after_hours) {
              escalationLevel = i + 1;
            }
          }

          // Create SLA violation
          const violation = {
            request_id: request.id,
            request_type: 'schema_boundary',
            sla_config_id: slaConfig.id,
            violation_type: 'response_time',
            expected_resolution_at: new Date(
              new Date(request.created_at).getTime() +
              slaConfig.resolution_time_hours * 60 * 60 * 1000
            ).toISOString(),
            escalation_level: escalationLevel,
          };

          await supabase
            .from('platform_admin.sla_violations')
            .insert(violation);

          violations.push(violation);

          console.log(`SLA violation created for request ${request.id}, escalation level ${escalationLevel}`);
        }
      }
    }

    // Send email notifications to platform admins if violations were created
    if (violations.length > 0) {
      try {
        // Get platform admins
        const { data: admins } = await supabase.rpc('get_platform_admin_roles');
        
        if (admins && admins.length > 0) {
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            const adminEmails = admins.map((admin: any) => admin.email).filter(Boolean);
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            
            const emailContent = generateSLAViolationEmailContent(violations, pendingRequests || [], supabaseUrl);
            
            await resend.emails.send({
              from: 'Obsidian Platform Admin <onboarding@resend.dev>',
              to: adminEmails,
              subject: emailContent.subject,
              html: emailContent.html,
            });

            console.log(`SLA violation alert email sent to ${adminEmails.length} admins`);
          }
        }
      } catch (emailError) {
        console.error('Error sending SLA violation alert email:', emailError);
        // Continue execution even if email fails
      }
    }

    return new Response(
      JSON.stringify({
        violations,
        summary: {
          total: violations.length,
          checked: pendingRequests?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking SLA violations:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateSLAViolationEmailContent(violations: any[], pendingRequests: any[], supabaseUrl: string): { subject: string; html: string } {
  const platformAdminUrl = supabaseUrl.replace('.supabase.co', '') + '/platform-admin';
  
  const highEscalation = violations.filter(v => v.escalation_level >= 2);
  const subject = highEscalation.length > 0
    ? '🚨 Critical SLA Violations - High Escalation'
    : '⏰ SLA Violations Detected';

  const violationItems = violations.map(violation => {
    const request = pendingRequests.find(r => r.id === violation.request_id);
    const ageHours = request 
      ? Math.floor((Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60))
      : 0;
    
    return `
      <div style="margin: 16px 0; padding: 16px; border-left: 4px solid ${
        violation.escalation_level >= 2 ? '#dc2626' : '#f59e0b'
      }; background: ${
        violation.escalation_level >= 2 ? '#fef2f2' : '#fffbeb'
      }; border-radius: 4px;">
        <div style="font-weight: 600; color: ${
          violation.escalation_level >= 2 ? '#dc2626' : '#f59e0b'
        }; text-transform: uppercase; font-size: 12px; margin-bottom: 8px;">
          Escalation Level ${violation.escalation_level}
        </div>
        <div style="font-weight: 500; margin-bottom: 8px;">Request Pending for ${ageHours} hours</div>
        ${request ? `
          <div style="color: #6b7280; font-size: 14px;">
            <div><strong>User:</strong> ${request.user_name || 'Unknown'}</div>
            <div><strong>Operation:</strong> ${request.operation}</div>
            <div><strong>Source:</strong> ${request.source_schema} → <strong>Target:</strong> ${request.target_schema}</div>
            ${request.data_classification ? `<div><strong>Classification:</strong> ${request.data_classification}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .metric { font-size: 48px; font-weight: bold; color: #d97706; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">⏰ SLA Violations Detected</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Pending Requests Require Immediate Action</p>
          </div>
          <div class="content">
            <p style="margin: 0 0 20px 0;">The SLA monitoring system has detected ${violations.length} new violation${violations.length > 1 ? 's' : ''} for pending schema boundary requests.</p>
            
            <div class="metric">${violations.length}</div>
            <p style="text-align: center; color: #6b7280; margin-top: -10px; font-size: 14px;">
              New SLA Violation${violations.length > 1 ? 's' : ''}
            </p>

            <h2 style="font-size: 18px; margin: 24px 0 16px 0;">Violation Details</h2>
            ${violationItems}
            
            <p style="margin-top: 24px;"><strong>Impact:</strong></p>
            <ul style="color: #4b5563;">
              <li>Users are waiting for access approval</li>
              <li>Operational workflows may be blocked</li>
              <li>SLA commitments are at risk</li>
              <li>User satisfaction may be affected</li>
            </ul>
            
            <p><strong>Recommended Actions:</strong></p>
            <ul style="color: #4b5563;">
              <li>Review and process pending requests immediately</li>
              <li>Prioritize high escalation level violations</li>
              <li>Consider adding more approvers or delegation</li>
              <li>Review SLA thresholds if violations are frequent</li>
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
  `;

  return { subject, html };
}
