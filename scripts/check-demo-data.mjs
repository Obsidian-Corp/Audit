import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkDemoData() {
  console.log('=== Checking Demo Data ===\n');

  // Check demo user
  const { data: users } = await supabase.auth.admin.listUsers();
  const demoUser = users?.users?.find(u => u.email === 'demo@obsidian-audit.com');
  console.log('Demo User ID:', demoUser?.id);

  // Check user roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', demoUser?.id);
  console.log('\nUser Roles:', roles);
  if (rolesError) console.log('Roles Error:', rolesError);

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', demoUser?.id)
    .single();
  console.log('\nProfile:', profile);
  if (profileError) console.log('Profile Error:', profileError);

  // Check firms
  const { data: firms, error: firmsError } = await supabase
    .from('firms')
    .select('*');
  console.log('\nFirms:', firms?.length, 'records');
  if (firmsError) console.log('Firms Error:', firmsError);

  // Check clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*');
  console.log('Clients:', clients?.length, 'records');
  if (clientsError) console.log('Clients Error:', clientsError);

  // Check audits
  const { data: audits, error: auditsError } = await supabase
    .from('audits')
    .select('*');
  console.log('Audits:', audits?.length, 'records');
  if (auditsError) console.log('Audits Error:', auditsError);

  // Check engagement_procedures
  const { data: procedures, error: procError } = await supabase
    .from('engagement_procedures')
    .select('*');
  console.log('Engagement Procedures:', procedures?.length, 'records');
  if (procError) console.log('Procedures Error:', procError);

  // Check audit_findings
  const { data: findings, error: findingsError } = await supabase
    .from('audit_findings')
    .select('*');
  console.log('Audit Findings:', findings?.length, 'records');
  if (findingsError) console.log('Findings Error:', findingsError);

  // Check tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*');
  console.log('Tasks:', tasks?.length, 'records');
  if (tasksError) console.log('Tasks Error:', tasksError);

  // Check confirmations
  const { data: confirmations, error: confirmError } = await supabase
    .from('confirmations')
    .select('*');
  console.log('Confirmations:', confirmations?.length, 'records');
  if (confirmError) console.log('Confirmations Error:', confirmError);

  // Now let's check what RLS policies exist on key tables
  console.log('\n=== Checking RLS Status ===\n');

  // Try to query as the demo user to see what fails
  // We can't impersonate but we can check the policy definitions

  // Check if we have a way to view policies
  const { data: policiesQuery, error: policiesError } = await supabase
    .rpc('get_policies_info');

  if (policiesError) {
    console.log('Cannot query policies via RPC:', policiesError.message);
  } else {
    console.log('Policies:', policiesQuery);
  }
}

checkDemoData().catch(console.error);
