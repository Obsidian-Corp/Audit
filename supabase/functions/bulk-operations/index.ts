import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkOperation {
  operationType: 'approve_access' | 'deny_access' | 'update_scope' | 'revoke_access';
  targetIds: string[];
  parameters: Record<string, any>;
  dryRun?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  affectedCount: number;
}

interface OperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
  results: Array<{ id: string; status: string; data?: any }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'healthy', service: 'bulk-operations' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is platform admin
    const { data: isPlatformAdmin } = await supabaseClient.rpc('is_platform_admin', {
      _user_id: user.id
    });

    if (!isPlatformAdmin) {
      throw new Error('Insufficient permissions: Platform admin access required');
    }

    const operation: BulkOperation = await req.json();
    const { operationType, targetIds, parameters, dryRun = false } = operation;

    // Validate operation
    const validation = await validateBulkOperation(supabaseClient, user.id, operation);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          validation,
          message: 'Validation failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // If dry-run, return validation results without executing
    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          dryRun: true,
          validation,
          message: 'Dry-run completed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute bulk operation with transaction support
    const result = await executeBulkOperation(supabaseClient, user.id, operation);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk operation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function validateBulkOperation(
  supabase: any,
  adminId: string,
  operation: BulkOperation
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let affectedCount = 0;

  const { operationType, targetIds, parameters } = operation;

  // Validate target IDs
  if (!targetIds || targetIds.length === 0) {
    errors.push('No target IDs provided');
    return { valid: false, errors, warnings, affectedCount: 0 };
  }

  if (targetIds.length > 1000) {
    errors.push('Maximum 1000 operations allowed per batch');
    return { valid: false, errors, warnings, affectedCount: 0 };
  }

  // Check admin has valid access session
  const { data: hasAccess } = await supabase.rpc('check_platform_admin_access', {
    _admin_id: adminId
  });

  if (!hasAccess) {
    errors.push('No valid access session. Please justify access first.');
    return { valid: false, errors, warnings, affectedCount: 0 };
  }

  // Validate based on operation type
  switch (operationType) {
    case 'approve_access':
    case 'deny_access':
      // Validate access requests exist and are pending (for platform access requests)
      const { data: requests, error: requestsError } = await supabase
        .from('platform_access_requests')
        .select('id, status')
        .in('id', targetIds);

      if (requestsError) {
        errors.push(`Failed to fetch access requests: ${requestsError.message}`);
        break;
      }

      const pendingRequests = requests?.filter((r: any) => r.status === 'pending') || [];
      affectedCount = pendingRequests.length;

      if (pendingRequests.length !== targetIds.length) {
        warnings.push(`${targetIds.length - pendingRequests.length} requests are not in pending state`);
      }
      break;

    case 'update_scope':
      // Validate scope updates
      if (!parameters.scope_type || !parameters.scope_value) {
        errors.push('Scope type and value are required for scope updates');
      }

      const validScopeTypes = ['organization_subset', 'geography', 'tier', 'classification', 'all'];
      if (!validScopeTypes.includes(parameters.scope_type)) {
        errors.push(`Invalid scope type: ${parameters.scope_type}`);
      }

      affectedCount = targetIds.length;
      break;

    case 'revoke_access':
      // Validate active sessions exist
      const { data: sessions, error: sessionsError } = await supabase
        .from('platform_admin.access_justifications')
        .select('id, status')
        .in('id', targetIds)
        .eq('status', 'approved');

      if (sessionsError) {
        errors.push(`Failed to fetch active sessions: ${sessionsError.message}`);
        break;
      }

      affectedCount = sessions?.length || 0;

      if (sessions?.length !== targetIds.length) {
        warnings.push(`${targetIds.length - (sessions?.length || 0)} sessions are not active`);
      }
      break;

    default:
      errors.push(`Unknown operation type: ${operationType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    affectedCount
  };
}

async function executeBulkOperation(
  supabase: any,
  adminId: string,
  operation: BulkOperation
): Promise<OperationResult> {
  const { operationType, targetIds, parameters } = operation;
  const results: Array<{ id: string; status: string; data?: any }> = [];
  const errors: Array<{ id: string; error: string }> = [];

  let processedCount = 0;
  let failedCount = 0;

  // Process each target ID
  for (const targetId of targetIds) {
    try {
      let result;

      switch (operationType) {
        case 'approve_access':
          result = await supabase
            .from('platform_access_requests')
            .update({
              status: 'approved',
              reviewed_by: adminId,
              reviewed_at: new Date().toISOString(),
              review_notes: parameters.reason || 'Bulk approved'
            })
            .eq('id', targetId);
          break;

        case 'deny_access':
          result = await supabase
            .from('platform_access_requests')
            .update({
              status: 'rejected',
              reviewed_by: adminId,
              reviewed_at: new Date().toISOString(),
              review_notes: parameters.reason || 'Bulk denied'
            })
            .eq('id', targetId);
          break;

        case 'update_scope':
          result = await supabase.rpc('manage_admin_scope', {
            _admin_id: targetId,
            _scope_type: parameters.scope_type,
            _scope_value: parameters.scope_value,
            _operation: 'upsert'
          });
          break;

        case 'revoke_access':
          result = await supabase
            .from('platform_admin.access_justifications')
            .update({
              access_end: new Date().toISOString(),
              status: 'revoked'
            })
            .eq('id', targetId);
          break;
      }

      if (result.error) {
        throw result.error;
      }

      processedCount++;
      results.push({
        id: targetId,
        status: 'success',
        data: result.data
      });
    } catch (error) {
      failedCount++;
      errors.push({
        id: targetId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.push({
        id: targetId,
        status: 'failed'
      });
    }
  }

  // Log bulk operation
  await supabase.rpc('log_audit_event', {
    _user_id: adminId,
    _organization_id: null,
    _action: `bulk_${operationType}`,
    _resource_type: 'platform_admin',
    _resource_id: null,
    _metadata: {
      operation_type: operationType,
      total_count: targetIds.length,
      processed_count: processedCount,
      failed_count: failedCount,
      parameters
    }
  });

  return {
    success: failedCount === 0,
    processedCount,
    failedCount,
    errors,
    results
  };
}
