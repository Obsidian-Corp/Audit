import { createClient } from 'npm:@supabase/supabase-js@^2.79.0';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

// Hash verification using Web Crypto API (compatible with SHA-256 hashing)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hash;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminLoginRequest {
  email: string;
  password: string;
  ip_address?: string;
  user_agent?: string;
}

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

    const { email, password, ip_address, user_agent }: AdminLoginRequest = await req.json();

    console.log('[Admin Auth] Login attempt:', { email, ip_address });

    // Find admin user by email OR username using RPC
    const { data: adminUserResult, error: userError } = await supabaseClient
      .rpc('get_admin_user', { _identifier: email });

    const adminUser = (adminUserResult as any)?.[0];

    if (userError || !adminUser) {
      console.error('[Admin Auth] User not found:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if account is active
    if (!adminUser.is_active) {
      console.error('[Admin Auth] Account disabled:', email);
      return new Response(
        JSON.stringify({ error: 'Account is disabled' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if account is locked
    if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
      console.error('[Admin Auth] Account locked:', email);
      return new Response(
        JSON.stringify({ error: 'Account is temporarily locked. Please try again later.' }),
        { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, adminUser.password_hash);

    if (!passwordMatch) {
      console.error('[Admin Auth] Password mismatch:', email);
      
      // Increment failed login attempts via RPC
      await supabaseClient.rpc('increment_failed_login', {
        _admin_id: adminUser.id
      });

      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP whitelist ONLY if there are active whitelist entries
    const { data: whitelistCount } = await supabaseClient.rpc('get_active_ip_whitelist_count');
    
    if (whitelistCount && whitelistCount > 0) {
      // IP whitelist is configured, enforce it
      const { data: isWhitelisted } = await supabaseClient.rpc('is_ip_whitelisted', {
        _ip_address: ip_address || '0.0.0.0'
      });

      if (!isWhitelisted) {
        console.error('[Admin Auth] IP not whitelisted:', ip_address);
        return new Response(
          JSON.stringify({ error: 'IP address not whitelisted' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('[Admin Auth] IP whitelist not configured, skipping IP check');
    }

    // Check MFA if enabled
    if (adminUser.mfa_enabled) {
      // For now, return a flag that MFA is required
      // In a full implementation, this would validate TOTP tokens
      return new Response(
        JSON.stringify({ 
          mfa_required: true,
          admin_id: adminUser.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT token
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      full_name: adminUser.full_name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      iss: 'obsidian-platform-admin',
      aud: 'obsidian-platform'
    };

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const jwt = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

    // Create session via RPC
    const sessionToken = crypto.randomUUID();
    const { error: sessionError } = await supabaseClient.rpc('create_admin_session', {
      _admin_user_id: adminUser.id,
      _session_token: sessionToken,
      _ip_address: ip_address || '0.0.0.0',
      _user_agent: user_agent || 'unknown',
      _expires_minutes: 30
    });

    if (sessionError) {
      console.error('[Admin Auth] Session creation error:', sessionError);
    }

    // Reset failed login attempts via RPC
    await supabaseClient.rpc('reset_failed_login_and_update_last_login', {
      _admin_id: adminUser.id
    });

    console.log('[Admin Auth] Login successful:', email);

    return new Response(
      JSON.stringify({
        token: jwt,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
    console.error('[Admin Auth] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
