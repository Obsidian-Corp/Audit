#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// The project ref
const projectRef = 'qtsvdeauuawfewdzbflr';

async function createSqlFunction() {
  console.log('Creating SQL execution function...');

  // Create a function that can execute SQL
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_raw_sql(sql_text TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_text;
      RETURN 'OK';
    END;
    $$;
  `;

  // We can't create the function without executing SQL first!
  // Let's try another approach - directly call the postgres REST endpoint

  return false;
}

async function fixViaAlternativeApproach() {
  console.log('Attempting to fix RLS via direct table manipulation...\n');

  // Since we can't execute raw SQL, let's try an alternative:
  // 1. Check if there's a way to use the admin API
  // 2. Or create a migration that will be applied

  // Let's first verify what the actual issue is by checking the policies
  // via pg_catalog tables (which may be accessible)

  try {
    // Try to get current policies
    const { data: policies, error } = await supabase
      .rpc('get_policies', {});

    if (error) {
      console.log('Cannot get policies via RPC:', error.message);
    } else {
      console.log('Current policies:', policies);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Alternative: Let's try using the pg_catalog directly
  console.log('\nTrying to query pg_policies...');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_my_policies`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const result = await response.json();
  console.log('Result:', result);
}

async function testWithAuthenticatedUser() {
  console.log('\n=== Testing with authenticated user ===\n');

  // Get the demo user
  const { data: users } = await supabase.auth.admin.listUsers();
  const demoUser = users?.users?.find(u => u.email === 'demo@obsidian-audit.com');

  if (!demoUser) {
    console.log('Demo user not found');
    return;
  }

  console.log('Demo user ID:', demoUser.id);

  // Check their roles with service role (bypasses RLS)
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', demoUser.id);

  console.log('\nUser roles (via service key):', roles);
  if (rolesError) console.log('Error:', rolesError);

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', demoUser.id);

  console.log('\nUser profile (via service key):', profile);
  if (profileError) console.log('Error:', profileError);

  // Now let's try to impersonate the user and see what happens
  // Create a client with the user's session
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: demoUser.email,
    options: {
      redirectTo: 'http://localhost:8082'
    }
  });

  console.log('\nMagic link generated:', sessionData?.properties?.action_link ? 'Yes' : 'No');
  if (sessionError) console.log('Session error:', sessionError);
}

async function main() {
  console.log('=== RLS Policy Fix Attempt ===\n');

  await fixViaAlternativeApproach();
  await testWithAuthenticatedUser();

  console.log('\n=== Summary ===');
  console.log('The RLS policies need to be fixed via the Supabase Dashboard.');
  console.log('Navigate to: https://supabase.com/dashboard/project/qtsvdeauuawfewdzbflr/sql');
  console.log('\nExecute this SQL:');
  console.log(`
-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
DROP POLICY IF EXISTS "user_roles_policy" ON user_roles;

-- Create a simple non-recursive policy
CREATE POLICY "user_roles_read_own"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Also ensure profiles has a simple policy
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

CREATE POLICY "profiles_read_own"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());
  `);
}

main().catch(console.error);
