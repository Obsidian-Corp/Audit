#!/usr/bin/env node

/**
 * Execute SQL to fix clients INSERT RLS policy
 * Uses Supabase Management API
 */

import { readFileSync } from 'fs';

const projectRef = 'otbviownvtbuatjsoezq';
const sql = `
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

DROP POLICY IF EXISTS "Leaders can insert clients" ON clients;
DROP POLICY IF EXISTS "firm_members_insert_clients" ON clients;

CREATE POLICY "firm_members_insert_clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

SELECT 'Client INSERT policy successfully created!' as result;
`;

console.log('🔧 Attempting to fix clients INSERT RLS policy...\n');

// Check if we have DB password
const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword) {
  console.error('❌ DB_PASSWORD environment variable not set');
  console.log('\nPlease run this SQL in Supabase Studio SQL Editor:');
  console.log('https://supabase.com/dashboard/project/otbviownvtbuatjsoezq/sql/new\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  process.exit(1);
}

// Try to execute via pg
const { spawn } = await import('child_process');

const psql = spawn('psql', [
  '-h', `db.${projectRef}.supabase.co`,
  '-U', 'postgres',
  '-p', '5432',
  '-d', 'postgres',
  '-c', sql
], {
  env: { ...process.env, PGPASSWORD: dbPassword }
});

psql.stdout.on('data', (data) => {
  console.log(data.toString());
});

psql.stderr.on('data', (data) => {
  console.error(data.toString());
});

psql.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ RLS policy fix applied successfully!');
    console.log('You can now try adding a client again.');
  } else {
    console.log('\n❌ Failed to apply fix.');
    console.log('\nPlease run this SQL in Supabase Studio SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
  }
  process.exit(code);
});
