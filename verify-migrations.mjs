#!/usr/bin/env node

/**
 * Migration Verification Script
 * Checks if database migrations have been applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  console.log('🔍 Checking database migration status...\n');

  const results = {
    risk_assessment_requirements: false,
    confirmations: false,
    check_risk_assessment_complete: false,
    get_confirmation_stats: false,
  };

  // Check if risk_assessment_requirements table exists
  console.log('📋 Checking tables...');
  try {
    const { data, error } = await supabase
      .from('risk_assessment_requirements')
      .select('id')
      .limit(1);

    if (!error || error.code === 'PGRST116') { // PGRST116 = no rows, but table exists
      results.risk_assessment_requirements = true;
      console.log('  ✅ risk_assessment_requirements table exists');
    } else if (error.code === '42P01') { // Table doesn't exist
      console.log('  ❌ risk_assessment_requirements table NOT FOUND');
      console.log(`     Error: ${error.message}`);
    } else {
      console.log(`  ⚠️  risk_assessment_requirements - unexpected error: ${error.message}`);
    }
  } catch (e) {
    console.log(`  ❌ risk_assessment_requirements check failed: ${e.message}`);
  }

  // Check if confirmations table exists
  try {
    const { data, error } = await supabase
      .from('confirmations')
      .select('id')
      .limit(1);

    if (!error || error.code === 'PGRST116') {
      results.confirmations = true;
      console.log('  ✅ confirmations table exists');
    } else if (error.code === '42P01') {
      console.log('  ❌ confirmations table NOT FOUND');
      console.log(`     Error: ${error.message}`);
    } else {
      console.log(`  ⚠️  confirmations - unexpected error: ${error.message}`);
    }
  } catch (e) {
    console.log(`  ❌ confirmations check failed: ${e.message}`);
  }

  // Check if check_risk_assessment_complete function exists
  console.log('\n🔧 Checking RPC functions...');
  try {
    const { data, error } = await supabase.rpc('check_risk_assessment_complete', {
      engagement_id_param: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    });

    if (!error || error.message?.includes('violates')) {
      results.check_risk_assessment_complete = true;
      console.log('  ✅ check_risk_assessment_complete() function exists');
    } else if (error.code === '42883') { // Function doesn't exist
      console.log('  ❌ check_risk_assessment_complete() function NOT FOUND');
      console.log(`     Error: ${error.message}`);
    } else {
      console.log(`  ⚠️  check_risk_assessment_complete() - unexpected error: ${error.message}`);
    }
  } catch (e) {
    console.log(`  ❌ check_risk_assessment_complete() check failed: ${e.message}`);
  }

  // Check if get_confirmation_stats function exists
  try {
    const { data, error } = await supabase.rpc('get_confirmation_stats', {
      engagement_id_param: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    });

    if (!error || error.message?.includes('violates') || (Array.isArray(data) && data.length === 0)) {
      results.get_confirmation_stats = true;
      console.log('  ✅ get_confirmation_stats() function exists');
    } else if (error.code === '42883') {
      console.log('  ❌ get_confirmation_stats() function NOT FOUND');
      console.log(`     Error: ${error.message}`);
    } else {
      console.log(`  ⚠️  get_confirmation_stats() - unexpected error: ${error.message}`);
    }
  } catch (e) {
    console.log(`  ❌ get_confirmation_stats() check failed: ${e.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION STATUS SUMMARY');
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(v => v === true);

  console.log('\nMigration: 20251130120000_enforce_risk_first_workflow.sql');
  console.log(`  Table: risk_assessment_requirements... ${results.risk_assessment_requirements ? '✅' : '❌'}`);
  console.log(`  Function: check_risk_assessment_complete()... ${results.check_risk_assessment_complete ? '✅' : '❌'}`);

  console.log('\nMigration: 20251130120001_create_confirmation_tracker.sql');
  console.log(`  Table: confirmations... ${results.confirmations ? '✅' : '❌'}`);
  console.log(`  Function: get_confirmation_stats()... ${results.get_confirmation_stats ? '✅' : '❌'}`);

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('✅ ALL MIGRATIONS APPLIED SUCCESSFULLY');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ SOME MIGRATIONS NOT APPLIED');
    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:');
    console.log('   1. Apply migrations manually via Supabase Dashboard SQL Editor');
    console.log('   2. Or use: npx supabase db push --db-url <connection-string>');
    console.log('   3. Migration files are in: supabase/migrations/');
    process.exit(1);
  }
}

checkMigrations().catch(err => {
  console.error('\n❌ Verification script failed:', err);
  process.exit(1);
});
