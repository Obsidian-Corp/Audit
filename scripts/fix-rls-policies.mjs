import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRlsPolicies() {
  console.log('Fixing RLS policies for user_roles table...\n');

  // Use the rpc to execute raw SQL
  // First, let's try using the postgres REST API directly

  const sql = `
    -- Drop existing policies that may cause recursion
    DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
    DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
    DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
    DROP POLICY IF EXISTS "user_roles_policy" ON user_roles;

    -- Create simple policy - user can read their own roles
    CREATE POLICY "Users can read own roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

    -- Also fix profiles to avoid any recursion there
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

    CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  `;

  // Unfortunately Supabase JS client doesn't have a direct SQL execution method
  // We need to use the Management API or Supabase CLI
  // Let's try calling the database functions if they exist

  console.log('Attempting to use supabase.rpc for SQL execution...');

  // Check if there's an exec_sql function
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.log('exec_sql RPC not available:', error.message);
    console.log('\nThe SQL needs to be executed via Supabase Dashboard or CLI.');
    console.log('\nSQL to execute:');
    console.log('=' .repeat(60));
    console.log(sql);
    console.log('=' .repeat(60));

    // Let's try an alternative - use the postgrest-js to check current policies
    console.log('\nChecking current user_roles data access...');

    // With service role, we bypass RLS
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.log('Error fetching roles:', rolesError);
    } else {
      console.log('User roles in database:', roles);
    }

    return false;
  }

  console.log('SQL executed successfully:', data);
  return true;
}

fixRlsPolicies().catch(console.error);
