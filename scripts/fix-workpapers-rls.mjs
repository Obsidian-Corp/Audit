import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixWorkpapersRLS() {
  console.log('Fixing audit_workpapers RLS...\n');

  // The SQL to fix RLS - disable it entirely for now to confirm data access works
  const sql = `
    -- Disable RLS on audit_workpapers temporarily
    ALTER TABLE public.audit_workpapers DISABLE ROW LEVEL SECURITY;

    -- Also check if there are any triggers causing issues
    SELECT tgname, tgtype FROM pg_trigger WHERE tgrelid = 'public.audit_workpapers'::regclass;
  `;

  // We can't run raw SQL via REST API, but we can verify the data exists
  console.log('Checking if workpapers exist...');
  const { data: workpapers, error: wpError } = await supabase
    .from('audit_workpapers')
    .select('id, audit_id, title, firm_id, status')
    .limit(10);

  if (wpError) {
    console.error('Error fetching workpapers:', wpError);
  } else {
    console.log(`Found ${workpapers.length} workpapers:`);
    workpapers.forEach(wp => {
      console.log(`  - ${wp.title} (audit: ${wp.audit_id}, firm: ${wp.firm_id})`);
    });
  }

  // Check what audit IDs have workpapers
  console.log('\n\nChecking workpaper distribution across audits...');
  const { data: auditCounts, error: acError } = await supabase
    .from('audit_workpapers')
    .select('audit_id');

  if (acError) {
    console.error('Error:', acError);
  } else {
    const counts = {};
    auditCounts.forEach(w => {
      counts[w.audit_id] = (counts[w.audit_id] || 0) + 1;
    });
    console.log('Workpapers per audit:');
    Object.entries(counts).forEach(([auditId, count]) => {
      console.log(`  - Audit ${auditId}: ${count} workpapers`);
    });
  }

  // Verify firm_id matches for demo user
  console.log('\n\nChecking demo user firm...');
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, email, firm_id')
    .eq('email', 'demo@obsidian-audit.com');

  if (profError) {
    console.error('Error:', profError);
  } else if (profiles.length > 0) {
    const demoUser = profiles[0];
    console.log(`Demo user: ${demoUser.email}`);
    console.log(`  Profile ID: ${demoUser.id}`);
    console.log(`  Firm ID: ${demoUser.firm_id}`);

    // Check if workpapers exist for this firm
    const { data: firmWorkpapers, error: fwError } = await supabase
      .from('audit_workpapers')
      .select('id, title')
      .eq('firm_id', demoUser.firm_id)
      .limit(5);

    if (fwError) {
      console.error('Error fetching firm workpapers:', fwError);
    } else {
      console.log(`\nWorkpapers for firm ${demoUser.firm_id}: ${firmWorkpapers.length}`);
      firmWorkpapers.forEach(wp => console.log(`  - ${wp.title}`));
    }
  }
}

fixWorkpapersRLS().catch(console.error);
