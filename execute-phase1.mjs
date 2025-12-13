import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function executePhase1() {
  // Extract project ID from Supabase URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://otbviownvtbuatjsoezq.supabase.co';
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'otbviownvtbuatjsoezq';

  const client = new Client({
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${projectId}`,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    console.log('Reading Phase 1 migration file...');
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251203100001_phase1_balanced_foundation.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    console.log('✓ Migration file loaded\n');

    console.log('Executing Phase 1: Foundation...');
    console.log('This will:');
    console.log('  - Create helper functions');
    console.log('  - Update user trigger');
    console.log('  - Backfill users with firms and roles\n');

    await client.query(sql);

    console.log('\n✅ Phase 1 completed successfully!');
    console.log('Foundation is ready. You can now run Phase 2.\n');
  } catch (error) {
    console.error('\n❌ Phase 1 failed:');
    console.error('Error:', error.message);
    if (error.position) console.error('Position:', error.position);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✓ Database connection closed');
  }
}

executePhase1();
