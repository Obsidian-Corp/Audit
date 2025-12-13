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
    const { alert_id, action } = await req.json();

    const updates: any = { updated_at: new Date().toISOString() };

    if (action === 'acknowledge') {
      updates.status = 'acknowledged';
      updates.acknowledged_by = adminId;
      updates.acknowledged_at = new Date().toISOString();
    } else if (action === 'resolve') {
      updates.status = 'resolved';
      updates.resolved_at = new Date().toISOString();
    } else if (action === 'dismiss') {
      updates.status = 'dismissed';
    }

    const { error } = await supabaseClient
      .from('health_alerts')
      .update(updates)
      .eq('id', alert_id);

    if (error) throw error;

    console.log(`[Admin Handle Health Alert] ${action} alert ${alert_id} by admin ${adminId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Handle Health Alert] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
