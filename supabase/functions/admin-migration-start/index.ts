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

    console.log('[Admin Migration] Starting migration token generation');

    // Generate migration tokens for all existing platform admins
    const { data, error } = await supabaseClient.rpc('generate_admin_migration_tokens');

    if (error) {
      console.error('[Admin Migration] Error generating tokens:', error);
      throw error;
    }

    console.log('[Admin Migration] Generated tokens for', data?.length || 0, 'admins');

    // Return the tokens (in production, these would be sent via email)
    return new Response(
      JSON.stringify({
        success: true,
        migrations: data,
        message: `Generated ${data?.length || 0} migration tokens`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Migration] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
