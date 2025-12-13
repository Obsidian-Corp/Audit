import { createClient } from 'npm:@supabase/supabase-js@^2.79.0';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = Deno.env.get('ADMIN_JWT_SECRET') || 'your-admin-jwt-secret-change-this';
const encoder = new TextEncoder();
const keyData = encoder.encode(JWT_SECRET);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const payload = await verify(token, key);

    // Verify admin still exists and is active via RPC
    const { data: adminUserResult, error: userError } = await supabaseClient
      .rpc('get_admin_user_by_id', { _id: payload.sub as string });

    const adminUser = (adminUserResult as any)?.[0];

    if (userError || !adminUser || !adminUser.is_active) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive admin account' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username,
          full_name: adminUser.full_name
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Auth Verify] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
