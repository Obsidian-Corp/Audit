#!/usr/bin/env node

/**
 * Quick script to fix the clients INSERT RLS policy
 * This bypasses migration ordering issues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFile = join(__dirname, 'supabase/migrations/20251203000000_fix_clients_insert_now.sql');
const sql = readFileSync(sqlFile, 'utf8');

console.log('🔧 Applying RLS policy fix for clients table...\n');

// Note: The Supabase JS client doesn't support executing raw SQL for security reasons
// We need to use the service role key or database connection string
console.log('⚠️  The Supabase JS client cannot execute raw SQL migrations.');
console.log('Please do one of the following:');
console.log('');
console.log('1. Use Supabase Studio SQL Editor:');
console.log('   - Go to https://supabase.com/dashboard/project/otbviownvtbuatjsoezq/sql/new');
console.log('   - Paste the SQL from: supabase/migrations/20251203000000_fix_clients_insert_now.sql');
console.log('   - Click "RUN"');
console.log('');
console.log('2. Or temporarily rename old migrations and push:');
console.log('   - Rename files matching 20251129_*.sql to *.sql.skip');
console.log('   - Run: supabase db push');
console.log('   - Rename them back');
console.log('');

// Output the SQL for easy copy-paste
console.log('📋 SQL to execute:\n');
console.log('─'.repeat(80));
console.log(sql);
console.log('─'.repeat(80));
