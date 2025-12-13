import { createClient } from 'npm:@supabase/supabase-js@^2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
}

interface BootstrapRequest {
  email: string;
  password: string;
  full_name: string;
  username: string;
}

// Hash password using Web Crypto API (native to Deno)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if this is the first run via RPC
    const { data: adminCountResult } = await supabaseClient
      .rpc('get_platform_admin_count');

    const adminCount = adminCountResult as number;

    if (adminCount > 0) {
      return new Response(
        JSON.stringify({ error: 'Platform admin already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Defensively parse body (accept both full_name and fullName)
    const email = body.email;
    const username = body.username;
    const password = body.password;
    const full_name = body.full_name ?? body.fullName;
    
    // Validate required fields
    if (!email || !username || !password || !full_name) {
      const missing = [];
      if (!email) missing.push('email');
      if (!username) missing.push('username');
      if (!password) missing.push('password');
      if (!full_name) missing.push('full_name');
      
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          missing_fields: missing 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Admin Bootstrap] Creating first admin:', email);

    // Hash password
    const password_hash = await hashPassword(password);

    // Create admin user via RPC (no direct schema access needed)
    const { data: adminUserResult, error: createError } = await supabaseClient
      .rpc('create_platform_admin_user', {
        _email: email,
        _username: username,
        _full_name: full_name,
        _password_hash: password_hash
      });

    const adminUser = (adminUserResult as AdminUser[] | null)?.[0];

    if (createError || !adminUser) {
      console.error('[Admin Bootstrap] Error creating admin:', createError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create admin user',
          details: createError?.message,
          code: createError?.code
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign platform admin role (legacy table for compatibility)
    await supabaseClient.rpc('assign_platform_admin_role', {
      _user_id: adminUser.id,
      _assigned_by: adminUser.id,
      _metadata: { bootstrap: true, created_at: new Date().toISOString() }
    });

    console.log('[Admin Bootstrap] Successfully created first admin');

    return new Response(
      JSON.stringify({
        success: true,
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
    console.error('[Admin Bootstrap] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
