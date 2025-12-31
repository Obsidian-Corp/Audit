#!/usr/bin/env node
/**
 * Seed Workflow Demo Data Script
 * Ticket: DEMO-001 & DEMO-002
 *
 * Seeds demo data for the workflow tables using ACTUAL database schema.
 * Updated to match actual column names in Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Use existing firm IDs from migrations
const FIRM_IDS = {
  obsidian: '00000000-0000-0000-0000-000000000001',
};

// Use existing audit IDs from migrations
const AUDIT_IDS = {
  aud1: '10000000-0000-0000-0000-000000000001',
  aud2: '10000000-0000-0000-0000-000000000002',
  aud3: '10000000-0000-0000-0000-000000000003',
};

// Get demo users
async function getDemoUsers() {
  console.log('Fetching demo users...');

  const { data: users } = await supabase.auth.admin.listUsers();
  const demoUsers = users?.users?.filter(u =>
    u.email?.endsWith('@obsidian-audit.com')
  ) || [];

  const userMap = {};
  for (const user of demoUsers) {
    if (user.email === 'demo@obsidian-audit.com') userMap.demo = user.id;
    if (user.email === 'manager@obsidian-audit.com') userMap.manager = user.id;
    if (user.email === 'partner@obsidian-audit.com') userMap.partner = user.id;
    if (user.email === 'staff@obsidian-audit.com') userMap.staff = user.id;
  }

  console.log(`  Found ${Object.keys(userMap).length} demo users`);
  return userMap;
}

// Seed audit procedures using ACTUAL schema columns
// Schema: procedure_name, procedure_code, category, objective, instructions, risk_level, procedure_type, is_active
async function seedAuditProcedures(users) {
  console.log('Seeding audit procedures...');

  const timestamp = Date.now().toString().slice(-4);

  // Using actual columns from audit_procedures table
  const procedures = [
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Revenue Recognition Testing',
      procedure_code: `REV-${timestamp}-01`,
      category: 'substantive_test',
      objective: 'Test revenue recognition for compliance with ASC 606',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test revenue recognition controls and transactions.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 8,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Revenue Cutoff Testing',
      procedure_code: `REV-${timestamp}-02`,
      category: 'substantive_test',
      objective: 'Test revenue cutoff around year-end for proper period recognition',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select transactions near year-end and verify proper cutoff.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 6,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Bank Confirmations',
      procedure_code: `CASH-${timestamp}-01`,
      category: 'confirmation',
      objective: 'Confirm bank balances directly with financial institutions',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Send and reconcile bank confirmations.' }]}] },
      risk_level: 'medium',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 4,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'AR Confirmations',
      procedure_code: `AR-${timestamp}-01`,
      category: 'confirmation',
      objective: 'Confirm accounts receivable balances with customers',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select sample of AR and send positive confirmations.' }]}] },
      risk_level: 'medium',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 6,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'AR Aging Analysis',
      procedure_code: `AR-${timestamp}-02`,
      category: 'analytical',
      objective: 'Test aging of accounts receivable and evaluate allowance for doubtful accounts',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Obtain AR aging, test accuracy, and evaluate collectibility.' }]}] },
      risk_level: 'medium',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 5,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Inventory Observation',
      procedure_code: `INV-${timestamp}-01`,
      category: 'observation',
      objective: 'Observe physical inventory count and test count procedures',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Attend physical inventory count and perform test counts.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 8,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Fixed Asset Roll-Forward',
      procedure_code: `FA-${timestamp}-01`,
      category: 'substantive_test',
      objective: 'Test fixed asset additions, disposals, and depreciation',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Obtain roll-forward and test significant additions/disposals.' }]}] },
      risk_level: 'low',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 4,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Access Controls Testing',
      procedure_code: `IT-${timestamp}-01`,
      category: 'control_test',
      objective: 'Test logical access controls for key systems',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review access provisioning and termination controls.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 6,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Change Management Testing',
      procedure_code: `IT-${timestamp}-02`,
      category: 'control_test',
      objective: 'Test IT change management controls',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select sample of changes and verify approval process.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 5,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'Security Risk Assessment',
      procedure_code: `SEC-${timestamp}-01`,
      category: 'risk_assessment',
      objective: 'Perform HIPAA security risk assessment',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Evaluate security controls against HIPAA requirements.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 12,
    },
    {
      firm_id: FIRM_IDS.obsidian,
      procedure_name: 'PHI Access Logging Review',
      procedure_code: `SEC-${timestamp}-02`,
      category: 'control_test',
      objective: 'Test PHI access logging controls',
      instructions: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review access logs for PHI systems and test logging completeness.' }]}] },
      risk_level: 'high',
      procedure_type: 'standard',
      is_active: true,
      estimated_hours: 6,
    },
  ];

  const { data, error } = await supabase.from('audit_procedures').insert(procedures).select();
  if (error) {
    console.error('Error seeding procedures:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} audit procedures`);
  return data;
}

// Seed workpapers using existing schema columns only
async function seedWorkpapers(users) {
  console.log('Seeding additional workpapers...');

  if (!users.demo) {
    console.log('  ⚠ Skipping workpapers - no demo user found');
    return [];
  }

  // Using actual columns from audit_workpapers table
  const workpapers = [
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-A-100',
      title: 'Revenue Testing Summary',
      workpaper_type: 'testing',
      status: 'in_review',
      content: { summary: 'Revenue recognition testing procedures and results', sampleSize: 45 },
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-A-200',
      title: 'Revenue Cutoff Analysis',
      workpaper_type: 'analysis',
      status: 'in_review',
      content: { transactionsTested: 40, exceptionsFound: 2 },
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-B-100',
      title: 'Bank Confirmation Summary',
      workpaper_type: 'confirmation',
      status: 'reviewed',
      content: { accountsConfirmed: 8, totalBalance: 10650000 },
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-C-100',
      title: 'AR Confirmation Tracker',
      workpaper_type: 'confirmation',
      status: 'in_review',
      content: { confirmationsSent: 25, responsesReceived: 18 },
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-C-200',
      title: 'AR Aging Analysis',
      workpaper_type: 'analysis',
      status: 'draft',
      content: { totalAR: 15000000, over90Days: 1250000 },
    },
    {
      audit_id: AUDIT_IDS.aud2,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-IT-100',
      title: 'ITGC Testing Matrix',
      workpaper_type: 'testing',
      status: 'in_review',
      content: { controlsTested: 25, deficienciesFound: 2 },
    },
    {
      audit_id: AUDIT_IDS.aud3,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-H-100',
      title: 'HIPAA Security Assessment',
      workpaper_type: 'assessment',
      status: 'reviewed',
      content: { riskAreas: 15, highRisks: 3 },
    },
  ];

  const { data, error } = await supabase.from('audit_workpapers').insert(workpapers).select();
  if (error) {
    console.error('Error seeding workpapers:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} workpapers`);
  return data;
}

// Seed additional findings using ACTUAL schema columns
// Schema: audit_id (not engagement_id), finding_number, finding_title, finding_type, severity, status, etc.
async function seedFindings(users) {
  console.log('Seeding additional findings...');

  const timestamp = Date.now().toString().slice(-6);

  // Using actual columns from audit_findings table
  const findings = [
    {
      audit_id: AUDIT_IDS.aud1,  // Changed from engagement_id
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-WF-${timestamp}-001`,
      finding_title: 'Segregation of Duties Issue',
      finding_type: 'control_deficiency',
      severity: 'medium',
      condition_description: 'Same individual can create and approve purchase orders over $10,000.',
      criteria: 'Segregation of duties should prevent the same individual from initiating and approving transactions.',
      cause: 'System permissions not properly configured after ERP upgrade.',
      effect: 'Increased risk of unauthorized or fraudulent transactions.',
      recommendation: 'Reconfigure ERP permissions to enforce proper segregation.',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-WF-${timestamp}-002`,
      finding_title: 'Incomplete Journal Entry Review',
      finding_type: 'control_deficiency',
      severity: 'low',
      condition_description: 'Manual journal entries under $5,000 not consistently reviewed.',
      criteria: 'All manual journal entries should be reviewed and approved.',
      cause: 'Policy exception for small entries without formal approval process.',
      effect: 'Potential for errors to go undetected.',
      recommendation: 'Implement review process for all manual entries regardless of amount.',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    {
      audit_id: AUDIT_IDS.aud2,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-WF-${timestamp}-003`,
      finding_title: 'Password Policy Non-Compliance',
      finding_type: 'control_deficiency',
      severity: 'high',
      condition_description: 'Password complexity requirements not enforced on legacy system.',
      criteria: 'All systems should enforce minimum 12-character passwords with complexity.',
      cause: 'Legacy system does not support modern password policies.',
      effect: 'Increased risk of unauthorized access through weak passwords.',
      recommendation: 'Implement compensating controls or upgrade legacy system.',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    {
      audit_id: AUDIT_IDS.aud3,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-WF-${timestamp}-004`,
      finding_title: 'PHI Access Without Logging',
      finding_type: 'control_deficiency',
      severity: 'high',
      condition_description: 'Several PHI access events were not captured in audit logs.',
      criteria: 'HIPAA requires complete logging of all PHI access.',
      cause: 'Logging configuration does not cover all access paths.',
      effect: 'Non-compliance with HIPAA audit requirements.',
      recommendation: 'Update logging configuration to capture all access paths.',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
  ];

  const { data, error } = await supabase.from('audit_findings').insert(findings).select();
  if (error) {
    console.error('Error seeding findings:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} additional findings`);
  return data;
}

// Check if tables exist and have required columns
async function checkSchema() {
  console.log('Checking database schema...');

  // Check audit_procedures
  const { error: procError } = await supabase
    .from('audit_procedures')
    .select('id')
    .limit(1);

  if (procError) {
    console.log('  ⚠ audit_procedures table issue:', procError.message);
    return false;
  }

  // Check audit_workpapers
  const { error: wpError } = await supabase
    .from('audit_workpapers')
    .select('id')
    .limit(1);

  if (wpError) {
    console.log('  ⚠ audit_workpapers table issue:', wpError.message);
    return false;
  }

  // Check audit_findings
  const { error: findError } = await supabase
    .from('audit_findings')
    .select('id')
    .limit(1);

  if (findError) {
    console.log('  ⚠ audit_findings table issue:', findError.message);
    return false;
  }

  console.log('  ✓ Schema check passed');
  return true;
}

// Main
async function main() {
  console.log('='.repeat(60));
  console.log('WORKFLOW DEMO DATA SEEDING (Fixed Schema)');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Check schema
    const schemaOk = await checkSchema();
    if (!schemaOk) {
      console.log('\n⚠ Schema check failed. Some tables may not exist.\n');
    }

    // Get demo users
    const users = await getDemoUsers();

    if (!users.demo) {
      console.log('\n⚠ No demo users found. Please run seed-demo-data.mjs first.\n');
      process.exit(1);
    }

    // Seed data using actual schema columns
    const procedures = await seedAuditProcedures(users);
    const workpapers = await seedWorkpapers(users);
    const findings = await seedFindings(users);

    console.log('');
    console.log('='.repeat(60));
    console.log('WORKFLOW DATA SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Demo data created:');
    console.log(`  • ${procedures.length} audit procedures`);
    console.log(`  • ${workpapers.length} workpapers`);
    console.log(`  • ${findings.length} additional findings`);
    console.log('');
    console.log('Note: Advanced workflow features (signoffs, review notes, notifications)');
    console.log('require running the database migrations first.');
    console.log('');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
