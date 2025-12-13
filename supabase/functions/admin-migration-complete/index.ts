import { createClient } from 'npm:@supabase/supabase-js@^2.79.0';

// Hash password using Web Crypto API (native to Deno)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationCompleteRequest {
  migration_token: string;
  new_password: string;
  username: string;
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

    const { migration_token, new_password, username }: MigrationCompleteRequest = await req.json();

    console.log('[Admin Migration Complete] Processing migration for token:', migration_token);

    // Validate password strength
    if (new_password.length < 12) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 12 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the new password
    const password_hash = await hashPassword(new_password);

    // Complete migration
    const { data, error } = await supabaseClient.rpc('complete_admin_migration', {
      _migration_token: migration_token,
      _new_password_hash: password_hash,
      _username: username
    });

    if (error) {
      console.error('[Admin Migration Complete] Error:', error);
      throw error;
    }

    console.log('[Admin Migration Complete] Successfully migrated admin:', data.email);

    return new Response(
      JSON.stringify({
        success: true,
        admin_id: data.admin_id,
        email: data.email,
        message: 'Migration completed successfully. MFA enrollment required on first login.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Migration Complete] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
