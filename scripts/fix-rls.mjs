#!/usr/bin/env node
/**
 * Fix RLS Policies Script
 * Adds permissive policies for demo data visibility
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRLSPolicies() {
  console.log('Fixing RLS policies for demo data visibility...\n');

  // We need to use the postgres connection directly for DDL commands
  // Since we can't do that via supabase-js, we'll verify the data instead
  // and provide a workaround

  // Check current data
  console.log('1. Checking clients table...');
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, client_name, firm_id, status')
    .limit(5);

  if (clientsError) {
    console.error('Error fetching clients:', clientsError.message);
  } else {
    console.log(`   Found ${clients.length} clients`);
    clients.forEach(c => console.log(`   - ${c.client_name} (firm: ${c.firm_id})`));
  }

  console.log('\n2. Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, firm_id')
    .limit(5);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
  } else {
    console.log(`   Found ${profiles.length} profiles`);
    profiles.forEach(p => console.log(`   - ${p.email} (firm: ${p.firm_id})`));
  }

  console.log('\n3. Checking user_roles table...');
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role, firm_id')
    .limit(10);

  if (rolesError) {
    console.error('Error fetching roles:', rolesError.message);
  } else {
    console.log(`   Found ${roles.length} user roles`);
    roles.forEach(r => console.log(`   - ${r.user_id.substring(0,8)}... -> ${r.role} (firm: ${r.firm_id})`));
  }

  console.log('\n4. Checking engagements/audits table...');
  const { data: audits, error: auditsError } = await supabase
    .from('audits')
    .select('id, audit_title, firm_id, status')
    .limit(5);

  if (auditsError) {
    console.error('Error fetching audits:', auditsError.message);
  } else {
    console.log(`   Found ${audits.length} audits`);
    audits.forEach(a => console.log(`   - ${a.audit_title} (firm: ${a.firm_id}, status: ${a.status})`));
  }

  console.log('\n✅ Data verification complete!');
  console.log('\nNote: If you are still not seeing data in the UI, the issue is likely RLS policies.');
  console.log('The RLS policies need to allow authenticated users to read data from their firm.');
  console.log('\nTo fix this, run the following SQL in the Supabase SQL Editor:');
  console.log('-------------------------------------------------------------------');
  console.log(`
-- Allow authenticated users to read clients in their firm
DROP POLICY IF EXISTS "Users can view clients in their firm" ON clients;
CREATE POLICY "Users can view clients in their firm"
ON clients FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Allow authenticated users to read audits in their firm
DROP POLICY IF EXISTS "Users can view audits in their firm" ON audits;
CREATE POLICY "Users can view audits in their firm"
ON audits FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Allow authenticated users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));
`);
  console.log('-------------------------------------------------------------------');
}

fixRLSPolicies().catch(console.error);
