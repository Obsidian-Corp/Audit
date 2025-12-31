import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function investigateSchema() {
  console.log('=== COMPREHENSIVE SCHEMA INVESTIGATION ===\n');

  // 1. Check tasks table columns
  console.log('=== TASKS TABLE ===');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (tasksError) {
    console.log('Tasks Error:', tasksError);
  } else if (tasks && tasks.length > 0) {
    console.log('Tasks columns:', Object.keys(tasks[0]).sort().join(', '));
    console.log('Has assigned_to:', 'assigned_to' in tasks[0]);
    console.log('Has assignee_id:', 'assignee_id' in tasks[0]);
    console.log('Has assigned_by:', 'assigned_by' in tasks[0]);
    console.log('Has engagement_id:', 'engagement_id' in tasks[0]);
  }

  // 2. Check audits table columns
  console.log('\n=== AUDITS TABLE ===');
  const { data: audits, error: auditsError } = await supabase
    .from('audits')
    .select('*')
    .limit(1);

  if (auditsError) {
    console.log('Audits Error:', auditsError);
  } else if (audits && audits.length > 0) {
    console.log('Audits columns:', Object.keys(audits[0]).sort().join(', '));
    console.log('Has budgeted_hours:', 'budgeted_hours' in audits[0]);
    console.log('Has budget_hours:', 'budget_hours' in audits[0]);
    console.log('Has hours_allocated:', 'hours_allocated' in audits[0]);
  }

  // 3. Check clients table columns
  console.log('\n=== CLIENTS TABLE ===');
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .limit(1);

  if (clientsError) {
    console.log('Clients Error:', clientsError);
  } else if (clients && clients.length > 0) {
    console.log('Clients columns:', Object.keys(clients[0]).sort().join(', '));
    console.log('Has name:', 'name' in clients[0]);
    console.log('Has client_name:', 'client_name' in clients[0]);
  }

  // 4. Check if engagements table exists
  console.log('\n=== ENGAGEMENTS TABLE ===');
  const { data: engagements, error: engagementsError } = await supabase
    .from('engagements')
    .select('*')
    .limit(1);

  if (engagementsError) {
    console.log('Engagements Error:', engagementsError.message);
    console.log('Table exists:', engagementsError.code !== '42P01');
  } else {
    console.log('Engagements table EXISTS with', engagements?.length, 'sample records');
    if (engagements && engagements.length > 0) {
      console.log('Columns:', Object.keys(engagements[0]).sort().join(', '));
    }
  }

  // 5. Check if information_requests table exists
  console.log('\n=== INFORMATION_REQUESTS TABLE ===');
  const { data: infoReqs, error: infoReqsError } = await supabase
    .from('information_requests')
    .select('*')
    .limit(1);

  if (infoReqsError) {
    console.log('Information Requests Error:', infoReqsError.message);
  } else {
    console.log('Information Requests table EXISTS with', infoReqs?.length, 'sample records');
  }

  // 6. Check user_roles table
  console.log('\n=== USER_ROLES TABLE ===');
  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(1);

  if (userRolesError) {
    console.log('User Roles Error:', userRolesError);
  } else if (userRoles && userRoles.length > 0) {
    console.log('User Roles columns:', Object.keys(userRoles[0]).sort().join(', '));
  }

  // 7. Check audit_findings table
  console.log('\n=== AUDIT_FINDINGS TABLE ===');
  const { data: findings, error: findingsError } = await supabase
    .from('audit_findings')
    .select('*')
    .limit(1);

  if (findingsError) {
    console.log('Audit Findings Error:', findingsError);
  } else if (findings && findings.length > 0) {
    console.log('Audit Findings columns:', Object.keys(findings[0]).sort().join(', '));
  }

  // 8. Check engagement_procedures table
  console.log('\n=== ENGAGEMENT_PROCEDURES TABLE ===');
  const { data: procs, error: procsError } = await supabase
    .from('engagement_procedures')
    .select('*')
    .limit(1);

  if (procsError) {
    console.log('Engagement Procedures Error:', procsError);
  } else {
    console.log('Engagement Procedures table exists with', procs?.length, 'records');
    if (procs && procs.length > 0) {
      console.log('Columns:', Object.keys(procs[0]).sort().join(', '));
    }
  }

  // 9. Check confirmations table
  console.log('\n=== CONFIRMATIONS TABLE ===');
  const { data: confirmations, error: confirmError } = await supabase
    .from('confirmations')
    .select('*')
    .limit(1);

  if (confirmError) {
    console.log('Confirmations Error:', confirmError);
  } else if (confirmations && confirmations.length > 0) {
    console.log('Confirmations columns:', Object.keys(confirmations[0]).sort().join(', '));
  }

  // 10. Check profiles table
  console.log('\n=== PROFILES TABLE ===');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profilesError) {
    console.log('Profiles Error:', profilesError);
  } else if (profiles && profiles.length > 0) {
    console.log('Profiles columns:', Object.keys(profiles[0]).sort().join(', '));
  }

  // 11. List all tables in public schema
  console.log('\n=== ALL PUBLIC TABLES ===');
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables_list');

  if (tablesError) {
    console.log('Cannot list tables via RPC:', tablesError.message);
    // Alternative: list some known tables
    const knownTables = [
      'profiles', 'firms', 'clients', 'audits', 'tasks',
      'user_roles', 'audit_findings', 'engagement_procedures',
      'confirmations', 'notifications', 'engagements', 'information_requests',
      'audit_workpapers', 'audit_procedures', 'procedure_templates'
    ];
    console.log('Checking existence of known tables...');
    for (const table of knownTables) {
      const { error } = await supabase.from(table).select('count').limit(0);
      console.log(`  ${table}: ${error ? 'NOT FOUND or ERROR' : 'EXISTS'}`);
    }
  } else {
    console.log('Tables:', tables);
  }
}

investigateSchema().catch(console.error);
