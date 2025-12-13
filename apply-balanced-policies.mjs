import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://otbviownvtbuatjsoezq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YnZpb3dudnRidWF0anNvZXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDMxMTMsImV4cCI6MjA3OTc3OTExM30.HBBMOLM_y2CRyHdsHyIoioSNnsKZ9xXAvRICmAarsWs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyBalancedPolicies() {
  console.log('🚀 Applying Balanced RLS Policies\n');

  try {
    // Phase 1: Foundation
    console.log('📋 Phase 1: Foundation');
    console.log('Reading migration file...');
    const phase1Sql = readFileSync('./supabase/migrations/20251203100001_phase1_balanced_foundation.sql', 'utf8');

    console.log('Executing Phase 1...');
    const { data: phase1Data, error: phase1Error } = await supabase.rpc('exec_sql', { sql_query: phase1Sql });

    if (phase1Error) {
      console.error('❌ Phase 1 failed:', phase1Error);
      throw phase1Error;
    }

    console.log('✅ Phase 1 Complete\n');

    // Phase 2: Core Policies
    console.log('📋 Phase 2: Balanced Core Policies');
    console.log('Reading migration file...');
    const phase2Sql = readFileSync('./supabase/migrations/20251203100002_phase2_balanced_core_policies.sql', 'utf8');

    console.log('Executing Phase 2...');
    const { data: phase2Data, error: phase2Error } = await supabase.rpc('exec_sql', { sql_query: phase2Sql });

    if (phase2Error) {
      console.error('❌ Phase 2 failed:', phase2Error);
      throw phase2Error;
    }

    console.log('✅ Phase 2 Complete\n');

    // Assign current user partner role
    console.log('📋 Assigning Partner Role');
    const assignRoleSql = readFileSync('./assign-partner-role.sql', 'utf8');

    const { data: roleData, error: roleError } = await supabase.rpc('exec_sql', { sql_query: assignRoleSql });

    if (roleError) {
      console.warn('⚠️  Could not assign partner role:', roleError.message);
    } else {
      console.log('✅ Partner role assigned\n');
    }

    console.log('🎉 All migrations applied successfully!');
    console.log('\n✨ Your platform now has balanced RLS policies');
    console.log('   - Staff can create workpapers, procedures, findings');
    console.log('   - Everyone can track time');
    console.log('   - Managers can create engagements');
    console.log('   - Partners/BD can create clients');
    console.log('   - Firm isolation is maintained\n');
    console.log('Try creating a client now!');

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    console.log('\n📝 Manual fallback: Copy and paste these files into Supabase Studio SQL Editor:');
    console.log('   1. supabase/migrations/20251203100001_phase1_balanced_foundation.sql');
    console.log('   2. supabase/migrations/20251203100002_phase2_balanced_core_policies.sql');
    console.log('   3. assign-partner-role.sql');
    process.exit(1);
  }
}

applyBalancedPolicies();
