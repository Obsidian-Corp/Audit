import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSchema() {
  console.log('=== Checking Schema ===\n');

  // Test clients query (the one that's failing)
  console.log('Testing clients query...');
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .limit(3);

  if (clientsError) {
    console.log('Clients Error:', clientsError);
  } else {
    console.log('Clients sample:', JSON.stringify(clients[0], null, 2));
    console.log('Clients columns:', Object.keys(clients[0] || {}));
  }

  // Test the query that's failing: clients?select=*,audits:audits(count)&status=eq.active
  console.log('\n\nTesting clients with audits count...');
  const { data: clientsWithAudits, error: cwAuditsError } = await supabase
    .from('clients')
    .select('*, audits:audits(count)')
    .eq('status', 'active')
    .limit(3);

  if (cwAuditsError) {
    console.log('Clients with audits Error:', cwAuditsError);
  } else {
    console.log('Clients with audits:', clientsWithAudits?.length, 'records');
  }

  // Check if 'status' column exists
  console.log('\n\nChecking client statuses...');
  const { data: statuses, error: statusError } = await supabase
    .from('clients')
    .select('status')
    .limit(5);

  if (statusError) {
    console.log('Status Error:', statusError);
  } else {
    console.log('Client statuses:', statuses);
  }

  // Check audits table
  console.log('\n\nTesting audits query...');
  const { data: audits, error: auditsError } = await supabase
    .from('audits')
    .select('*')
    .limit(1);

  if (auditsError) {
    console.log('Audits Error:', auditsError);
  } else {
    console.log('Audits columns:', Object.keys(audits[0] || {}));
  }

  // Check tasks table
  console.log('\n\nTesting tasks query...');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (tasksError) {
    console.log('Tasks Error:', tasksError);
  } else {
    console.log('Tasks columns:', Object.keys(tasks[0] || {}));
  }

  // Check engagement_procedures (500 error - RLS)
  console.log('\n\nTesting engagement_procedures query...');
  const { data: procs, error: procsError } = await supabase
    .from('engagement_procedures')
    .select('*')
    .limit(1);

  if (procsError) {
    console.log('Engagement Procedures Error:', procsError);
  } else {
    console.log('Engagement Procedures:', procs?.length, 'records');
  }

  // Check audit_findings (500 error - RLS)
  console.log('\n\nTesting audit_findings query...');
  const { data: findings, error: findingsError } = await supabase
    .from('audit_findings')
    .select('*')
    .limit(1);

  if (findingsError) {
    console.log('Audit Findings Error:', findingsError);
  } else {
    console.log('Audit Findings:', findings?.length, 'records');
    console.log('Finding columns:', Object.keys(findings[0] || {}));
  }
}

checkSchema().catch(console.error);
