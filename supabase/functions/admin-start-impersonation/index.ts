import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get admin user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is platform admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'platform_admin')
      .maybeSingle();

    if (!adminRole) {
      throw new Error('Not a platform admin');
    }

    const { targetType, targetOrganizationId, targetUserId } = await req.json();

    // Validate target
    if (targetType === 'organization' && !targetOrganizationId) {
      throw new Error('Organization ID required');
    }
    if (targetType === 'user' && !targetUserId) {
      throw new Error('User ID required');
    }

    // Create impersonation session (1 hour duration)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { data: session, error: sessionError } = await supabase
      .from('impersonation_sessions')
      .insert({
        admin_id: user.id,
        target_type: targetType,
        target_organization_id: targetOrganizationId,
        target_user_id: targetUserId,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Generate impersonation token
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'default-secret-change-me');

    const impersonationToken = await new jose.SignJWT({
      session_id: session.id,
      admin_id: user.id,
      target_type: targetType,
      target_organization_id: targetOrganizationId,
      target_user_id: targetUserId,
      is_impersonating: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresAt)
      .setIssuedAt()
      .sign(secret);

    // Log to audit trail
    await supabase
      .from('impersonation_actions')
      .insert({
        session_id: session.id,
        action_type: 'session_started',
        details: {
          target_type: targetType,
          target_id: targetOrganizationId || targetUserId,
        },
      });

    return new Response(
      JSON.stringify({
        session_id: session.id,
        token: impersonationToken,
        expires_at: expiresAt.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
