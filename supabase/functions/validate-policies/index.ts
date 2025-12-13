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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active policies
    const { data: policies, error: policiesError } = await supabase
      .from('platform_admin.policy_definitions')
      .select('*')
      .eq('is_active', true);

    if (policiesError) throw policiesError;

    const violations: any[] = [];

    for (const policy of policies || []) {
      try {
        switch (policy.policy_type) {
          case 'access_control':
            await validateAccessControl(supabase, policy, violations);
            break;
          case 'data_retention':
            await validateDataRetention(supabase, policy, violations);
            break;
          case 'data_residency':
            await validateDataResidency(supabase, policy, violations);
            break;
          case 'security':
            await validateSecurity(supabase, policy, violations);
            break;
        }
      } catch (error) {
        console.error(`Error validating policy ${policy.id}:`, error);
      }
    }

    // Insert violations
    if (violations.length > 0) {
      const { error: insertError } = await supabase
        .from('platform_admin.policy_violations')
        .insert(violations);

      if (insertError) console.error('Error inserting violations:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        validated: policies?.length || 0,
        violations: violations.length,
        details: violations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function validateAccessControl(supabase: any, policy: any, violations: any[]) {
  const config = policy.policy_config;
  
  // Example: Check for users with excessive permissions
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('user_id, role, organization_id')
    .in('role', config.prohibited_roles || []);

  userRoles?.forEach((role: any) => {
    violations.push({
      policy_id: policy.id,
      organization_id: role.organization_id,
      resource_type: 'user_role',
      resource_id: role.user_id,
      severity: policy.severity,
      violation_details: {
        role: role.role,
        reason: `User has prohibited role: ${role.role}`
      }
    });
  });
}

async function validateDataRetention(supabase: any, policy: any, violations: any[]) {
  const config = policy.policy_config;
  const retentionDays = config.retention_days || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Example: Check audit logs older than retention period
  const { data: oldLogs } = await supabase
    .from('audit_logs')
    .select('id, organization_id')
    .lt('created_at', cutoffDate.toISOString())
    .limit(100);

  if (oldLogs && oldLogs.length > 0) {
    violations.push({
      policy_id: policy.id,
      organization_id: oldLogs[0].organization_id,
      resource_type: 'audit_log',
      resource_id: null,
      severity: policy.severity,
      violation_details: {
        count: oldLogs.length,
        reason: `${oldLogs.length} records exceed ${retentionDays} day retention policy`
      }
    });
  }
}

async function validateDataResidency(supabase: any, policy: any, violations: any[]) {
  // Check data residency rules
  const { data: rules } = await supabase
    .from('platform_admin.data_residency_rules')
    .select('*')
    .eq('organization_id', policy.organization_id)
    .eq('is_active', true);

  rules?.forEach((rule: any) => {
    if (rule.enforcement_level === 'blocking') {
      violations.push({
        policy_id: policy.id,
        organization_id: rule.organization_id,
        resource_type: 'data_residency',
        resource_id: rule.id,
        severity: 'high',
        violation_details: {
          data_type: rule.data_type,
          allowed_regions: rule.allowed_regions,
          reason: 'Data residency rule requires validation'
        }
      });
    }
  });
}

async function validateSecurity(supabase: any, policy: any, violations: any[]) {
  const config = policy.policy_config;
  
  // Example: Check for inactive MFA
  if (config.require_mfa) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, mfa_required')
      .eq('mfa_required', false);

    orgs?.forEach((org: any) => {
      violations.push({
        policy_id: policy.id,
        organization_id: org.id,
        resource_type: 'organization',
        resource_id: org.id,
        severity: policy.severity,
        violation_details: {
          org_name: org.name,
          reason: 'MFA not enforced for organization'
        }
      });
    });
  }
}
