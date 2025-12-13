import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function executeMigration() {
  const client = new Client({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.yqwgikdpjxlzipqtqxzj',
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully');

    console.log('\nReading migration file...');
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251203000010_comprehensive_rls_fix.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    console.log('✓ Migration file loaded');

    console.log('\nExecuting migration...');
    console.log('This may take a few moments...\n');

    const result = await client.query(sql);

    console.log('\n✅ Migration executed successfully!');
    if (result.length > 0) {
      console.log('\nQuery results:');
      result.forEach((r, i) => {
        if (r.rows && r.rows.length > 0) {
          console.log(`\nResult ${i + 1}:`);
          console.table(r.rows);
        }
      });
    }
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    if (error.position) {
      console.error('Position:', error.position);
    }
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

executeMigration();
