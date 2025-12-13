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
    const adminEmail = verifyData.admin.email;
    const adminName = verifyData.admin.full_name || adminEmail;
    const { email, message } = await req.json();

    // Generate secure token
    const invitationToken = crypto.randomUUID();

    // Create invitation record
    const { error: inviteError } = await supabaseClient
      .from('admin_invitations')
      .insert({
        token: invitationToken,
        invited_email: email,
        invited_by_admin_id: adminId,
        metadata: { message },
      });

    if (inviteError) throw inviteError;

    // Send invitation email
    const { error: emailError } = await supabaseClient.functions.invoke('send-invitation', {
      body: {
        email,
        roles: ['Platform Administrator'],
        organizationName: 'Obsidian Platform',
        invitedBy: adminName,
        token: invitationToken,
        message,
      },
    });

    if (emailError) {
      console.error('[Admin Invite Admin] Email error:', emailError);
    }

    console.log(`[Admin Invite Admin] Invited ${email} by admin ${adminId}`);

    return new Response(
      JSON.stringify({ success: true, token: invitationToken }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Invite Admin] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
