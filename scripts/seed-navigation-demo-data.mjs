#!/usr/bin/env node
/**
 * Seed Navigation Demo Data
 * Tickets: DEMO-001, DEMO-002, DEMO-003
 *
 * Creates demo data specifically for testing navigation features:
 * - User roles for role-based navigation visibility
 * - Badge count data (procedures, tasks, findings, etc.)
 * - Information requests and confirmations for badge counts
 *
 * Run: node scripts/seed-navigation-demo-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Use existing firm IDs
const FIRM_IDS = {
  obsidian: '00000000-0000-0000-0000-000000000001',
};

// Use existing audit IDs
const AUDIT_IDS = {
  aud1: '10000000-0000-0000-0000-000000000001',
  aud2: '10000000-0000-0000-0000-000000000002',
  aud3: '10000000-0000-0000-0000-000000000003',
};

// Demo user ID - will be set after looking up
let DEMO_USER_ID = null;

// ============================================================
// DEMO-002: Create Demo User Roles
// ============================================================

async function getDemoUserId() {
  console.log('Looking up demo user...');

  // Get demo user from auth
  const { data: users } = await supabase.auth.admin.listUsers();
  const demoUser = users?.users?.find(u => u.email === 'demo@obsidian-audit.com');

  if (demoUser) {
    DEMO_USER_ID = demoUser.id;
    console.log(`  ✓ Found demo user: ${DEMO_USER_ID}`);
    return DEMO_USER_ID;
  }

  console.log('  ⚠ Demo user not found. Run seed-demo-data.mjs first.');
  return null;
}

async function seedUserRoles() {
  console.log('\n=== DEMO-002: Seeding user roles ===\n');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping roles - no demo user');
    return;
  }

  // Check if roles already exist
  const { data: existingRoles } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', DEMO_USER_ID);

  if (existingRoles && existingRoles.length > 0) {
    console.log(`  ✓ User already has ${existingRoles.length} role(s): ${existingRoles.map(r => r.role).join(', ')}`);
    return;
  }

  // Assign senior_auditor role to demo user (has access to most features)
  const roles = [
    {
      user_id: DEMO_USER_ID,
      role: 'senior_auditor',
      firm_id: FIRM_IDS.obsidian,
    }
  ];

  const { data, error } = await supabase.from('user_roles').insert(roles).select();

  if (error) {
    console.error('  Error seeding roles:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} user role(s)`);

  // Also create roles for other demo users if they exist
  const otherUsers = [
    { email: 'manager@obsidian-audit.com', role: 'engagement_manager' },
    { email: 'partner@obsidian-audit.com', role: 'partner' },
    { email: 'staff@obsidian-audit.com', role: 'staff_auditor' },
  ];

  for (const user of otherUsers) {
    const foundUser = users?.users?.find(u => u.email === user.email);
    if (foundUser) {
      const { error: roleError } = await supabase.from('user_roles').upsert({
        user_id: foundUser.id,
        role: user.role,
        firm_id: FIRM_IDS.obsidian,
      }, { onConflict: 'user_id,role' });

      if (!roleError) {
        console.log(`  ✓ Assigned ${user.role} role to ${user.email}`);
      }
    }
  }
}

// ============================================================
// DEMO-001 & DEMO-003: Seed Navigation Demo Data and Badge Counts
// ============================================================

async function seedEngagementProcedures() {
  console.log('\n=== Seeding engagement procedures for badges ===\n');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping - no demo user');
    return;
  }

  // Create procedures in different statuses for badge counts
  const procedures = [
    // Not started - assigned to demo user
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'not_started', procedure_name: 'Revenue cutoff testing', procedure_reference: 'REV-001' },
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'not_started', procedure_name: 'AR confirmation follow-up', procedure_reference: 'AR-001' },
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'not_started', procedure_name: 'Inventory observation prep', procedure_reference: 'INV-001' },

    // In progress - assigned to demo user
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'in_progress', procedure_name: 'Bank reconciliation testing', procedure_reference: 'CASH-001' },
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'in_progress', procedure_name: 'Revenue analytics', procedure_reference: 'REV-002' },

    // In review - for review queue badge
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'in_review', procedure_name: 'Cash lead schedule', procedure_reference: 'CASH-002' },
    { engagement_id: AUDIT_IDS.aud2, assigned_to: DEMO_USER_ID, status: 'in_review', procedure_name: 'ITGC access controls', procedure_reference: 'IT-001' },
    { engagement_id: AUDIT_IDS.aud3, assigned_to: DEMO_USER_ID, status: 'in_review', procedure_name: 'HIPAA compliance testing', procedure_reference: 'HC-001' },

    // Completed
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'completed', procedure_name: 'Planning memo', procedure_reference: 'PLAN-001' },
    { engagement_id: AUDIT_IDS.aud1, assigned_to: DEMO_USER_ID, status: 'completed', procedure_name: 'Risk assessment', procedure_reference: 'RISK-001' },
  ];

  // Delete existing procedures to avoid duplicates
  await supabase.from('engagement_procedures').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase.from('engagement_procedures').insert(procedures).select();

  if (error) {
    console.error('  Error seeding procedures:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} engagement procedures`);
  console.log(`    - ${procedures.filter(p => p.status === 'not_started' || p.status === 'in_progress').length} for "My Procedures" badge`);
  console.log(`    - ${procedures.filter(p => p.status === 'in_review').length} for "Review Queue" badge`);
}

async function seedTasks() {
  console.log('\n=== Seeding tasks for badges ===\n');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping - no demo user');
    return;
  }

  // Check for existing projects
  const { data: projects } = await supabase.from('projects').select('id').limit(1);
  const projectId = projects?.[0]?.id;

  const tasks = [
    // Pending tasks - assigned to demo user
    { assignee_id: DEMO_USER_ID, title: 'Complete revenue documentation', status: 'pending', priority: 'high' },
    { assignee_id: DEMO_USER_ID, title: 'Follow up on AR confirmations', status: 'pending', priority: 'high' },
    { assignee_id: DEMO_USER_ID, title: 'Schedule inventory observation', status: 'pending', priority: 'medium' },
    { assignee_id: DEMO_USER_ID, title: 'Prepare management letter points', status: 'pending', priority: 'medium' },
    { assignee_id: DEMO_USER_ID, title: 'Review ITGC testing', status: 'pending', priority: 'low' },

    // In progress
    { assignee_id: DEMO_USER_ID, title: 'Update audit timeline', status: 'in_progress', priority: 'medium' },

    // Completed
    { assignee_id: DEMO_USER_ID, title: 'Planning meeting notes', status: 'completed', priority: 'low' },
  ];

  // Add project_id if available
  if (projectId) {
    tasks.forEach(t => t.project_id = projectId);
  }

  // Delete existing tasks for demo user
  await supabase.from('tasks').delete().eq('assignee_id', DEMO_USER_ID);

  const { data, error } = await supabase.from('tasks').insert(tasks).select();

  if (error) {
    console.error('  Error seeding tasks:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} tasks`);
  console.log(`    - ${tasks.filter(t => t.status === 'pending').length} pending for "Tasks" badge`);
}

async function seedFindings() {
  console.log('\n=== Seeding findings for badges ===\n');

  const timestamp = Date.now().toString().slice(-6);

  const findings = [
    // Open findings
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `NAV-${timestamp}-001`,
      finding_title: 'Revenue Recognition Policy Gap',
      finding_type: 'significant_deficiency',
      severity: 'high',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `NAV-${timestamp}-002`,
      finding_title: 'Segregation of Duties Issue',
      finding_type: 'control_deficiency',
      severity: 'medium',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    {
      audit_id: AUDIT_IDS.aud2,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `NAV-${timestamp}-003`,
      finding_title: 'IT Access Review Incomplete',
      finding_type: 'control_deficiency',
      severity: 'high',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    {
      audit_id: AUDIT_IDS.aud3,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `NAV-${timestamp}-004`,
      finding_title: 'PHI Encryption Gap',
      finding_type: 'regulatory_violation',
      severity: 'critical',
      status: 'open',
      identified_date: new Date().toISOString().split('T')[0],
    },
    // Resolved
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `NAV-${timestamp}-005`,
      finding_title: 'Minor Documentation Issue',
      finding_type: 'observation',
      severity: 'low',
      status: 'resolved',
      identified_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ];

  const { data, error } = await supabase.from('audit_findings').insert(findings).select();

  if (error) {
    console.error('  Error seeding findings:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} findings`);
  console.log(`    - ${findings.filter(f => f.status === 'open').length} open for "Findings" badge`);
}

async function seedInformationRequests() {
  console.log('\n=== Seeding information requests for badges ===\n');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping - no demo user');
    return;
  }

  const requests = [
    // Pending requests
    {
      engagement_id: AUDIT_IDS.aud1,
      requested_by: DEMO_USER_ID,
      title: 'Bank statements for December',
      description: 'Need all bank statements for December 2024',
      status: 'pending',
      priority: 'high',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      requested_by: DEMO_USER_ID,
      title: 'Revenue contracts list',
      description: 'Complete list of new revenue contracts in Q4',
      status: 'pending',
      priority: 'high',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      requested_by: DEMO_USER_ID,
      title: 'AR aging report',
      description: 'Accounts receivable aging as of 12/31',
      status: 'pending',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      engagement_id: AUDIT_IDS.aud2,
      requested_by: DEMO_USER_ID,
      title: 'User access reports',
      description: 'Active directory user access reports for all systems',
      status: 'pending',
      priority: 'high',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    // Received
    {
      engagement_id: AUDIT_IDS.aud1,
      requested_by: DEMO_USER_ID,
      title: 'Organization chart',
      description: 'Current organizational structure',
      status: 'received',
      priority: 'low',
      due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ];

  // Delete existing requests
  await supabase.from('information_requests').delete().eq('requested_by', DEMO_USER_ID);

  const { data, error } = await supabase.from('information_requests').insert(requests).select();

  if (error) {
    console.error('  Error seeding information requests:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} information requests`);
  console.log(`    - ${requests.filter(r => r.status === 'pending').length} pending for "Information Requests" badge`);
}

async function seedConfirmations() {
  console.log('\n=== Seeding confirmations for badges ===\n');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping - no demo user');
    return;
  }

  const confirmations = [
    // Sent - awaiting response
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'accounts_receivable',
      account_name: 'Customer A',
      balance_per_books: 250000,
      as_of_date: '2024-12-31',
      request_sent_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'accounts_receivable',
      account_name: 'Customer B',
      balance_per_books: 180000,
      as_of_date: '2024-12-31',
      request_sent_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'bank_account',
      account_name: 'Main Operating Account',
      balance_per_books: 5000000,
      as_of_date: '2024-12-31',
      request_sent_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
    },
    // Resolved
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'bank_account',
      account_name: 'Payroll Account',
      balance_per_books: 1000000,
      as_of_date: '2024-12-31',
      request_sent_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      response_received_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      balance_per_confirmation: 1000000,
      confirmation_agrees: true,
      status: 'resolved',
    },
  ];

  // Use upsert with onConflict to prevent duplicates
  const { data, error } = await supabase
    .from('confirmations')
    .upsert(confirmations, {
      onConflict: 'engagement_id,confirmation_type,account_name',
      ignoreDuplicates: true
    })
    .select();

  if (error) {
    console.error('  Error seeding confirmations:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} confirmations`);
  console.log(`    - ${confirmations.filter(c => c.status === 'sent').length} sent for "Confirmations" badge`);
}

async function seedEngagementsForApprovals() {
  console.log('\n=== Seeding engagements for approval badges ===\n');

  // Check for engagements with pending_approval status
  const { data: existingApprovals } = await supabase
    .from('engagements')
    .select('id')
    .eq('status', 'pending_approval');

  if (existingApprovals && existingApprovals.length > 0) {
    console.log(`  ✓ Found ${existingApprovals.length} existing pending approvals`);
    return;
  }

  // Update an existing engagement to pending_approval (if audits exist)
  const { data: audits } = await supabase.from('audits').select('id').limit(3);

  if (!audits || audits.length === 0) {
    console.log('  ⚠ No audits found to link engagements');
    return;
  }

  // Create engagements in pending_approval status
  const engagements = [
    {
      firm_id: FIRM_IDS.obsidian,
      name: 'FY2024 Audit - Final Review',
      status: 'pending_approval',
      engagement_type: 'financial_audit',
    },
    {
      firm_id: FIRM_IDS.obsidian,
      name: 'Q4 Controls Assessment',
      status: 'pending_approval',
      engagement_type: 'internal_audit',
    },
  ];

  const { data, error } = await supabase.from('engagements').insert(engagements).select();

  if (error) {
    console.error('  Error seeding engagements:', error.message);
    return;
  }

  console.log(`  ✓ Created ${data.length} engagements pending approval`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('NAVIGATION DEMO DATA SEEDING');
  console.log('Tickets: DEMO-001, DEMO-002, DEMO-003');
  console.log('='.repeat(60));

  try {
    // Get demo user ID first
    await getDemoUserId();

    // DEMO-002: Create demo user roles
    await seedUserRoles();

    // DEMO-001 & DEMO-003: Seed badge count data
    await seedEngagementProcedures();
    await seedTasks();
    await seedFindings();
    await seedInformationRequests();
    await seedConfirmations();
    await seedEngagementsForApprovals();

    console.log('\n' + '='.repeat(60));
    console.log('NAVIGATION DEMO DATA COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nExpected badge counts:');
    console.log('  • My Procedures: 5 (not_started + in_progress)');
    console.log('  • Tasks: 5 (pending)');
    console.log('  • Review Queue: 3 (in_review)');
    console.log('  • Approvals: 2 (pending_approval)');
    console.log('  • Findings: 4 (open)');
    console.log('  • Information Requests: 4 (pending)');
    console.log('  • Confirmations: 3 (sent)');
    console.log('\nRefresh the app to see the navigation badges!');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
