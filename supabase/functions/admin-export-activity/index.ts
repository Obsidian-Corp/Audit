import { createClient } from 'npm:@supabase/supabase-js@^2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: verifyData, error: verifyError } = await supabaseClient.functions.invoke(
      'admin-auth-verify',
      { headers: { Authorization: authHeader } }
    );

    if (verifyError || !verifyData?.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { start_date, end_date, activity_types } = await req.json();

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'start_date and end_date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const exportData: any = {
      generated_at: new Date().toISOString(),
      generated_by: verifyData.admin.email,
      date_range: { start_date, end_date },
    };

    // Fetch auth logs if requested
    if (!activity_types || activity_types.includes('auth')) {
      const { data: authLogs } = await supabaseClient
        .from('admin_auth_log')
        .select('*, admin:admin_user_id(email, full_name)')
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .order('created_at', { ascending: false });
      
      exportData.auth_logs = authLogs || [];
    }

    // Fetch access logs if requested
    if (!activity_types || activity_types.includes('access')) {
      const { data: accessLogs } = await supabaseClient
        .from('access_logs')
        .select('*, admin:admin_user_id(email, full_name)')
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .order('created_at', { ascending: false });
      
      exportData.access_logs = accessLogs || [];
    }

    // Fetch privilege elevation logs if requested
    if (!activity_types || activity_types.includes('privilege')) {
      const { data: privilegeLogs } = await supabaseClient
        .from('privilege_elevation_requests')
        .select('*, admin:admin_user_id(email, full_name), approver:approved_by(email, full_name)')
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .order('created_at', { ascending: false });
      
      exportData.privilege_logs = privilegeLogs || [];
    }

    // Fetch emergency access logs if requested
    if (!activity_types || activity_types.includes('emergency')) {
      const { data: emergencyLogs } = await supabaseClient
        .from('emergency_access_log')
        .select('*, admin:admin_user_id(email, full_name)')
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .order('created_at', { ascending: false });
      
      exportData.emergency_logs = emergencyLogs || [];
    }

    return new Response(
      JSON.stringify(exportData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Export Activity] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
