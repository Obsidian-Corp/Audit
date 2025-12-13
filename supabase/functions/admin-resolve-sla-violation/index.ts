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

    // Verify admin JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    const { data: verifyData, error: verifyError } = await supabaseClient.functions.invoke('admin-auth-verify', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (verifyError || !verifyData?.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminId = verifyData.admin.id;
    const { violation_id } = await req.json();

    const { error } = await supabaseClient
      .from('sla_violations')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
        violation_end: new Date().toISOString(),
      })
      .eq('id', violation_id);

    if (error) throw error;

    console.log(`[Admin Resolve SLA Violation] Resolved violation ${violation_id} by admin ${adminId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Resolve SLA Violation] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
