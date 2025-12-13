import { createClient } from 'npm:@supabase/supabase-js@^2.79.0';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

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

    const { token, password, full_name } = await req.json();

    // Verify invitation token
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('admin_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .single();

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin user already exists
    const { data: existingAdmin } = await supabaseClient
      .from('admin_users')
      .select('id')
      .eq('email', invitation.invited_email)
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin account already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin user (NOT in auth.users, in platform_admin.admin_users)
    const adminId = crypto.randomUUID();
    const { error: createError } = await supabaseClient
      .from('admin_users')
      .insert({
        id: adminId,
        email: invitation.invited_email,
        username: invitation.invited_email.split('@')[0],
        full_name,
        password_hash: password, // In production, hash this properly
        is_active: true,
      });

    if (createError) throw createError;

    // Mark invitation as accepted
    const { error: acceptError } = await supabaseClient
      .from('admin_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (acceptError) console.error('Error marking invitation accepted:', acceptError);

    // Assign platform_admin role
    const { error: roleError } = await supabaseClient.rpc('assign_platform_admin_role', {
      _user_id: adminId,
      _assigned_by: invitation.invited_by_admin_id,
    });

    if (roleError) console.error('Error assigning role:', roleError);

    // Generate JWT token for immediate login
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const jwtPayload = {
      sub: adminId,
      email: invitation.invited_email,
      role: 'platform_admin',
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
    };

    const jwtToken = await create({ alg: 'HS256', typ: 'JWT' }, jwtPayload, key);

    console.log(`[Admin Accept Invitation] Created admin ${adminId} for ${invitation.invited_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        token: jwtToken,
        admin: {
          id: adminId,
          email: invitation.invited_email,
          full_name,
        },
        expiresAt: new Date(jwtPayload.exp * 1000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Accept Invitation] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
