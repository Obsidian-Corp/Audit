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

    const { limit = 100, days_back = 30 } = await req.json().catch(() => ({}));

    // Get auth logs with admin user details
    const { data: logs, error } = await supabaseClient
      .from('admin_auth_log')
      .select(`
        *,
        admin:admin_user_id (
          email,
          full_name
        )
      `)
      .gte('created_at', new Date(Date.now() - days_back * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Admin Auth Logs] Error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch auth logs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ logs }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Auth Logs] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
