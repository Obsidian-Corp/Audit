#!/usr/bin/env node
/**
 * Comprehensive Seed Demo Data Script
 * Creates realistic demo data for the Obsidian Audit Platform
 * Includes auth user creation for full functionality
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
  global: '00000000-0000-0000-0000-000000000002',
  regional: '00000000-0000-0000-0000-000000000003'
};

// Use existing audit IDs from migrations
const AUDIT_IDS = {
  aud1: '10000000-0000-0000-0000-000000000001',
  aud2: '10000000-0000-0000-0000-000000000002',
  aud3: '10000000-0000-0000-0000-000000000003',
  aud4: '10000000-0000-0000-0000-000000000004',
  aud5: '10000000-0000-0000-0000-000000000005'
};

// Helper
const uuid = () => crypto.randomUUID();
const randomDate = (start, end) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

// Demo user ID - we'll use this for created_by fields
let DEMO_USER_ID = null;

// ============================================================
// AUTH USER AND PROFILE FUNCTIONS
// ============================================================

async function createDemoAuthUser() {
  console.log('Creating demo auth user...');

  const email = 'demo@obsidian-audit.com';
  const password = 'demo123456';

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === email);

  if (existingUser) {
    console.log('  ✓ Demo auth user already exists');
    DEMO_USER_ID = existingUser.id;
    return existingUser;
  }

  // Create new auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: 'Demo',
      last_name: 'User',
      firm_id: FIRM_IDS.obsidian
    }
  });

  if (error) {
    console.error('Error creating auth user:', error.message);
    return null;
  }

  DEMO_USER_ID = data.user.id;
  console.log(`  ✓ Created demo auth user (ID: ${DEMO_USER_ID})`);
  console.log(`    Email: ${email}`);
  console.log(`    Password: ${password}`);
  return data.user;
}

async function seedDemoProfile() {
  console.log('Seeding demo profile...');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping profile - no auth user');
    return null;
  }

  // Check if profile exists first
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', DEMO_USER_ID).single();
  if (existing) {
    console.log('  ✓ Demo profile already exists');
    return existing;
  }

  const profile = {
    id: DEMO_USER_ID,
    firm_id: FIRM_IDS.obsidian,
    email: 'demo@obsidian-audit.com',
    first_name: 'Demo',
    last_name: 'User',
    title: 'Senior Auditor'
  };

  const { data, error } = await supabase.from('profiles').insert(profile).select();
  if (error) {
    console.error('Error seeding profile:', error.message);
    return null;
  }
  console.log(`  ✓ Created demo profile`);
  return data?.[0];
}

async function createAdditionalUsers() {
  console.log('Creating additional team members...');

  const teamMembers = [
    { email: 'manager@obsidian-audit.com', first_name: 'Sarah', last_name: 'Manager', title: 'Audit Manager' },
    { email: 'partner@obsidian-audit.com', first_name: 'John', last_name: 'Partner', title: 'Audit Partner' },
    { email: 'staff@obsidian-audit.com', first_name: 'Mike', last_name: 'Staff', title: 'Staff Auditor' },
  ];

  const createdUsers = [];

  for (const member of teamMembers) {
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === member.email);

    if (existingUser) {
      createdUsers.push(existingUser.id);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: member.email,
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        first_name: member.first_name,
        last_name: member.last_name,
        firm_id: FIRM_IDS.obsidian
      }
    });

    if (!error && data.user) {
      createdUsers.push(data.user.id);

      // Create profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        firm_id: FIRM_IDS.obsidian,
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        title: member.title
      });
    }
  }

  console.log(`  ✓ Created ${createdUsers.length} additional team members`);
  return createdUsers;
}

async function seedClients() {
  console.log('Seeding clients...');

  const clients = [
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'Acme Corporation',
      client_code: 'ACME-001',
      industry: 'Technology',
      company_size: 'large',
      website: 'https://acme.example.com',
      status: 'active',
      client_type: 'enterprise',
      risk_rating: 'medium',
      annual_revenue: 500000000,
      client_since: '2020-01-15',
      notes: 'Long-term strategic client. Primary contact is CFO.',
      metadata: { sector: 'SaaS', publiclyTraded: true }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'TechStart Industries',
      client_code: 'TECH-002',
      industry: 'Technology',
      company_size: 'medium',
      website: 'https://techstart.example.com',
      status: 'active',
      client_type: 'growth',
      risk_rating: 'low',
      annual_revenue: 75000000,
      client_since: '2022-06-01',
      notes: 'Fast-growing startup preparing for IPO.',
      metadata: { sector: 'Fintech', ipoPlanned: true }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'HealthCare Plus',
      client_code: 'HCP-003',
      industry: 'Healthcare',
      company_size: 'large',
      website: 'https://healthcareplus.example.com',
      status: 'active',
      client_type: 'enterprise',
      risk_rating: 'high',
      annual_revenue: 850000000,
      client_since: '2019-03-20',
      notes: 'Complex regulatory environment. HIPAA compliance critical.',
      metadata: { sector: 'Hospital Systems', regulated: true }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'Green Energy Solutions',
      client_code: 'GES-004',
      industry: 'Energy',
      company_size: 'medium',
      website: 'https://greenenergy.example.com',
      status: 'active',
      client_type: 'growth',
      risk_rating: 'medium',
      annual_revenue: 120000000,
      client_since: '2021-09-15',
      notes: 'Renewable energy focus. Government contracts.',
      metadata: { sector: 'Renewable Energy', govContracts: true }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'Retail Dynamics Inc',
      client_code: 'RDI-005',
      industry: 'Retail',
      company_size: 'large',
      website: 'https://retaildynamics.example.com',
      status: 'active',
      client_type: 'enterprise',
      risk_rating: 'medium',
      annual_revenue: 2100000000,
      client_since: '2018-01-10',
      notes: 'National retail chain. Complex inventory systems.',
      metadata: { sector: 'Consumer Retail', storeCount: 450 }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'Financial Services Group',
      client_code: 'FSG-006',
      industry: 'Financial Services',
      company_size: 'large',
      website: 'https://fsgbank.example.com',
      status: 'active',
      client_type: 'enterprise',
      risk_rating: 'high',
      annual_revenue: 3500000000,
      client_since: '2017-06-01',
      notes: 'Regional bank. SOX compliance required.',
      metadata: { sector: 'Banking', regulatedEntity: true }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'Manufacturing Partners LLC',
      client_code: 'MPL-007',
      industry: 'Manufacturing',
      company_size: 'medium',
      website: 'https://mfgpartners.example.com',
      status: 'active',
      client_type: 'standard',
      risk_rating: 'low',
      annual_revenue: 95000000,
      client_since: '2023-02-15',
      notes: 'New client. Clean audit history.',
      metadata: { sector: 'Industrial Manufacturing' }
    },
    {
      firm_id: FIRM_IDS.obsidian,
      client_name: 'Real Estate Holdings Corp',
      client_code: 'REH-008',
      industry: 'Real Estate',
      company_size: 'large',
      website: 'https://rehcorp.example.com',
      status: 'active',
      client_type: 'enterprise',
      risk_rating: 'medium',
      annual_revenue: 650000000,
      client_since: '2020-11-01',
      notes: 'Commercial real estate portfolio. Complex lease accounting.',
      metadata: { sector: 'Commercial Real Estate', properties: 125 }
    }
  ];

  // Use upsert with ON CONFLICT to avoid duplicates
  const { data, error } = await supabase.from('clients')
    .upsert(clients, {
      onConflict: 'client_code,firm_id',
      ignoreDuplicates: true
    })
    .select();
  if (error) {
    console.error('Error seeding clients:', error.message);
    return [];
  }
  console.log(`  ✓ Upserted ${data.length} clients`);
  return data;
}

async function updateAuditsWithClients(clients) {
  console.log('Linking audits to clients...');

  const updates = [
    { id: AUDIT_IDS.aud1, client_id: clients[0]?.id },
    { id: AUDIT_IDS.aud2, client_id: clients[1]?.id },
    { id: AUDIT_IDS.aud3, client_id: clients[2]?.id },
    { id: AUDIT_IDS.aud4, client_id: clients[3]?.id },
    { id: AUDIT_IDS.aud5, client_id: clients[4]?.id },
  ];

  for (const update of updates) {
    if (update.client_id) {
      await supabase.from('audits').update({ client_id: update.client_id }).eq('id', update.id);
    }
  }
  console.log('  ✓ Linked audits to clients');
}

async function seedAuditPrograms() {
  console.log('Seeding audit programs...');

  const programs = [
    {
      firm_id: FIRM_IDS.obsidian,
      audit_id: AUDIT_IDS.aud1,
      program_name: 'Revenue Recognition Testing',
      program_type: 'substantive',
      control_objective: 'Ensure revenue is recognized in accordance with ASC 606',
      test_procedures: { steps: ['Select sample', 'Verify contracts', 'Test cutoff'] },
      sample_size: 45,
      sampling_method: 'random',
      status: 'in_progress',
      completion_percentage: 60
    },
    {
      firm_id: FIRM_IDS.obsidian,
      audit_id: AUDIT_IDS.aud1,
      program_name: 'Cash and Bank Confirmations',
      program_type: 'substantive',
      control_objective: 'Confirm cash balances and bank relationships',
      test_procedures: { steps: ['Send confirmations', 'Reconcile responses', 'Document results'] },
      sample_size: 8,
      sampling_method: 'all_items',
      status: 'completed',
      completion_percentage: 100
    },
    {
      firm_id: FIRM_IDS.obsidian,
      audit_id: AUDIT_IDS.aud1,
      program_name: 'Accounts Receivable',
      program_type: 'substantive',
      control_objective: 'Verify existence and valuation of accounts receivable',
      test_procedures: { steps: ['Aging analysis', 'Send confirmations', 'Test allowance'] },
      sample_size: 25,
      sampling_method: 'stratified',
      status: 'in_progress',
      completion_percentage: 65
    },
    {
      firm_id: FIRM_IDS.obsidian,
      audit_id: AUDIT_IDS.aud1,
      program_name: 'Inventory Observation',
      program_type: 'substantive',
      control_objective: 'Observe physical inventory counts and test valuation',
      test_procedures: { steps: ['Attend count', 'Test count accuracy', 'Verify pricing'] },
      sample_size: 100,
      sampling_method: 'stratified',
      status: 'not_started',
      completion_percentage: 0
    },
    {
      firm_id: FIRM_IDS.obsidian,
      audit_id: AUDIT_IDS.aud2,
      program_name: 'IT General Controls',
      program_type: 'control',
      control_objective: 'Test IT general controls for access and change management',
      test_procedures: { steps: ['Test access controls', 'Review change tickets', 'Test segregation'] },
      sample_size: 25,
      sampling_method: 'random',
      status: 'in_progress',
      completion_percentage: 55
    },
    {
      firm_id: FIRM_IDS.obsidian,
      audit_id: AUDIT_IDS.aud3,
      program_name: 'HIPAA Compliance',
      program_type: 'compliance',
      control_objective: 'Test compliance with HIPAA privacy and security rules',
      test_procedures: { steps: ['Review policies', 'Test access logs', 'Verify encryption'] },
      sample_size: 50,
      sampling_method: 'random',
      status: 'in_progress',
      completion_percentage: 70
    }
  ];

  const { data, error } = await supabase.from('audit_programs').insert(programs).select();
  if (error) {
    console.error('Error seeding audit programs:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} audit programs`);
  return data;
}

async function seedMoreWorkpapers() {
  console.log('Seeding additional workpapers...');

  const workpapers = [
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-A-002',
      title: 'Accounts Receivable Lead Schedule',
      workpaper_type: 'lead_schedule',
      content: { summary: 'AR aging and lead schedule analysis', totalAR: 15000000 },
      prepared_date: '2024-12-10',
      status: 'draft'
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-A-003',
      title: 'Revenue Cutoff Testing',
      workpaper_type: 'testing',
      content: { summary: 'Revenue cutoff testing around year-end', sampleSize: 45 },
      prepared_date: '2024-12-18',
      status: 'in_review'
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-B-001',
      title: 'Bank Confirmation Summary',
      workpaper_type: 'confirmation',
      content: { summary: 'Bank confirmation results', confirmedBalance: 8500000 },
      prepared_date: '2024-11-20',
      status: 'reviewed'
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-C-001',
      title: 'Inventory Count Memo',
      workpaper_type: 'memo',
      content: { summary: 'Inventory observation planning memorandum' },
      prepared_date: '2024-12-01',
      status: 'draft'
    },
    {
      audit_id: AUDIT_IDS.aud2,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-IT-001',
      title: 'ITGC Testing Matrix',
      workpaper_type: 'testing',
      content: { summary: 'IT General Controls testing matrix', controlsTested: 25 },
      prepared_date: '2024-11-15',
      status: 'in_review'
    },
    {
      audit_id: AUDIT_IDS.aud3,
      firm_id: FIRM_IDS.obsidian,
      reference_number: 'WP-H-001',
      title: 'HIPAA Risk Assessment',
      workpaper_type: 'analysis',
      content: { summary: 'HIPAA security risk assessment documentation' },
      prepared_date: '2024-10-20',
      status: 'reviewed'
    }
  ];

  // Use upsert to avoid duplicates
  const { data, error } = await supabase.from('audit_workpapers')
    .upsert(workpapers, {
      onConflict: 'reference_number,audit_id',
      ignoreDuplicates: true
    })
    .select();
  if (error) {
    console.error('Error seeding workpapers:', error.message);
    return [];
  }
  console.log(`  ✓ Upserted ${data.length} additional workpapers`);
  return data;
}

async function seedMoreFindings() {
  console.log('Seeding additional findings...');

  // Use unique finding numbers that won't conflict with existing data
  const timestamp = Date.now().toString().slice(-6);
  const findings = [
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-${timestamp}-002`,
      finding_title: 'Revenue Recognition Timing',
      finding_type: 'misstatement',
      severity: 'medium',
      condition_description: 'Three transactions totaling $125,000 were recognized before delivery criteria met.',
      criteria: 'ASC 606 requires revenue recognition when control transfers to customer.',
      cause: 'Manual revenue recognition process without automated delivery confirmation.',
      effect: 'Revenue overstated by $125,000 at testing date.',
      recommendation: 'Implement automated workflow linking revenue recognition to proof of delivery.',
      status: 'open',
      identified_date: '2024-12-15'
    },
    {
      audit_id: AUDIT_IDS.aud1,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-${timestamp}-003`,
      finding_title: 'AR Allowance Methodology',
      finding_type: 'significant_deficiency',
      severity: 'medium',
      condition_description: 'Allowance for doubtful accounts not updated quarterly as per policy.',
      criteria: 'Company policy requires quarterly review and update of AR allowance.',
      cause: 'Resource constraints in accounting department.',
      effect: 'Potential overstatement of AR if allowance is understated.',
      recommendation: 'Implement quarterly review process with documented analysis.',
      status: 'pending_response',
      identified_date: '2024-12-10'
    },
    {
      audit_id: AUDIT_IDS.aud2,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-${timestamp}-004`,
      finding_title: 'User Access Review Not Performed',
      finding_type: 'control_deficiency',
      severity: 'high',
      condition_description: 'Quarterly user access reviews for ERP system not performed in Q3.',
      criteria: 'SOX control requires quarterly access reviews.',
      cause: 'IT staff turnover and lack of handoff documentation.',
      effect: 'Increased risk of unauthorized access to financial systems.',
      recommendation: 'Implement automated access review reminders and assign backup reviewers.',
      status: 'open',
      identified_date: '2024-11-20'
    },
    {
      audit_id: AUDIT_IDS.aud3,
      firm_id: FIRM_IDS.obsidian,
      finding_number: `F-${timestamp}-005`,
      finding_title: 'PHI Access Logging Gaps',
      finding_type: 'regulatory_violation',
      severity: 'high',
      condition_description: 'Access logs for PHI not retained for required 6-year period.',
      criteria: 'HIPAA requires retention of access logs for minimum of 6 years.',
      cause: 'Log rotation policy set to 2 years instead of 6.',
      effect: 'Non-compliance with HIPAA requirements.',
      recommendation: 'Update log retention policy and implement automated archival.',
      status: 'open',
      identified_date: '2024-10-25'
    }
  ];

  // Use upsert to avoid duplicates (finding_title + audit_id is unique)
  const { data, error } = await supabase.from('audit_findings')
    .upsert(findings, {
      onConflict: 'finding_title,audit_id',
      ignoreDuplicates: true
    })
    .select();
  if (error) {
    console.error('Error seeding findings:', error.message);
    return [];
  }
  console.log(`  ✓ Upserted ${data.length} additional findings`);
  return data;
}

async function seedRisks(projectIds) {
  console.log('Seeding risks...');

  if (!projectIds || projectIds.length === 0) {
    console.log('  ⚠ Skipping risks - no projects available');
    return [];
  }

  // Note: risks table uses organization_id (references organizations table)
  // Valid probability: 'low', 'medium', 'high'
  // Valid impact: 'low', 'medium', 'high', 'critical'
  // Valid status: 'identified', 'assessing', 'mitigating', 'monitoring', 'closed'
  // risk_score is GENERATED - don't include it
  const risks = [
    {
      organization_id: FIRM_IDS.obsidian,
      project_id: projectIds[0],
      title: 'Revenue Recognition Complexity',
      description: 'Complex revenue arrangements with multiple performance obligations',
      category: 'technical',
      probability: 'high',
      impact: 'high',
      status: 'identified',
      mitigation_plan: 'Extended substantive testing of revenue contracts',
      identified_date: '2024-11-01'
    },
    {
      organization_id: FIRM_IDS.obsidian,
      project_id: projectIds[0],
      title: 'Related Party Transactions',
      description: 'Significant transactions with affiliated entities require heightened scrutiny',
      category: 'other',
      probability: 'medium',
      impact: 'critical',
      status: 'assessing',
      mitigation_plan: 'Obtain detailed analysis of all related party transactions',
      identified_date: '2024-11-05'
    },
    {
      organization_id: FIRM_IDS.obsidian,
      project_id: projectIds[0],
      title: 'Inventory Obsolescence',
      description: 'Technology inventory may be subject to rapid obsolescence',
      category: 'technical',
      probability: 'medium',
      impact: 'medium',
      status: 'mitigating',
      mitigation_plan: 'Test obsolescence reserve calculation and assumptions',
      identified_date: '2024-10-20'
    },
    {
      organization_id: FIRM_IDS.obsidian,
      project_id: projectIds.length > 1 ? projectIds[1] : projectIds[0],
      title: 'HIPAA Data Breach',
      description: 'Healthcare data subject to breach and regulatory penalties',
      category: 'external',
      probability: 'medium',
      impact: 'critical',
      status: 'monitoring',
      mitigation_plan: 'Comprehensive IT security controls testing',
      identified_date: '2024-10-15'
    }
  ];

  const { data, error } = await supabase.from('risks').insert(risks).select();
  if (error) {
    console.error('Error seeding risks:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} risks`);
  return data;
}

async function seedTimeEntries(projectIds, taskIds) {
  console.log('Seeding time entries...');

  if (!projectIds || projectIds.length === 0) {
    console.log('  ⚠ Skipping time entries - no projects available');
    return [];
  }

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping time entries - no user_id available');
    return [];
  }

  // Valid status: 'draft', 'submitted', 'approved', 'rejected'
  const entries = [];
  const now = new Date();
  const activities = [
    'Revenue testing - sample selection',
    'Bank confirmation follow-up',
    'AR aging analysis review',
    'Workpaper documentation',
    'Manager review meeting',
    'Client inquiry - revenue contracts',
    'ITGC testing - access controls',
    'Inventory count planning',
    'Finding documentation',
    'Team coordination call'
  ];

  // Generate time entries for past 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // 2-4 entries per day
    const numEntries = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numEntries; i++) {
      const projectId = projectIds[Math.floor(Math.random() * projectIds.length)];
      const taskId = taskIds && taskIds.length > 0 ? taskIds[Math.floor(Math.random() * taskIds.length)] : null;
      const durationHours = parseFloat((1 + Math.random() * 4).toFixed(1));
      const startTime = new Date(date);
      startTime.setHours(9 + i * 2, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + Math.floor(durationHours));

      entries.push({
        organization_id: FIRM_IDS.obsidian,
        user_id: DEMO_USER_ID,
        project_id: projectId,
        task_id: taskId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_hours: durationHours,
        description: activities[Math.floor(Math.random() * activities.length)],
        is_billable: Math.random() > 0.1,
        billable_rate: [175, 225, 275, 350][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.3 ? 'approved' : 'draft'
      });
    }
  }

  const { data, error } = await supabase.from('time_entries').insert(entries).select();
  if (error) {
    console.error('Error seeding time entries:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} time entries`);
  return data;
}

async function seedTasks(projectIds, workstreamIds) {
  console.log('Seeding tasks...');

  if (!projectIds || projectIds.length === 0) {
    console.log('  ⚠ Skipping tasks - no projects available');
    return [];
  }

  const now = new Date();
  const tasks = [
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[0] || null,
      title: 'Complete revenue testing documentation',
      description: 'Finalize all workpapers for revenue testing program',
      status: 'in_progress',
      priority: 'high',
      due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['revenue', 'documentation']
    },
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[0] || null,
      title: 'Follow up on outstanding AR confirmations',
      description: 'Contact clients who have not responded to AR confirmations',
      status: 'todo',
      priority: 'high',
      due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['confirmations', 'follow-up']
    },
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[1] || workstreamIds?.[0] || null,
      title: 'Schedule inventory count observation',
      description: 'Coordinate with client for physical inventory observation',
      status: 'todo',
      priority: 'medium',
      due_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['inventory', 'planning']
    },
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[0] || null,
      title: 'Manager review - Cash section',
      description: 'Manager review of completed cash and bank workpapers',
      status: 'in_progress',
      priority: 'medium',
      due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['review', 'cash']
    },
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[2] || workstreamIds?.[0] || null,
      title: 'Draft management letter points',
      description: 'Compile control deficiencies for management letter',
      status: 'todo',
      priority: 'medium',
      due_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['management-letter', 'findings']
    },
    {
      project_id: projectIds.length > 1 ? projectIds[1] : projectIds[0],
      workstream_id: workstreamIds?.[1] || null,
      title: 'ITGC testing - Change management',
      description: 'Complete testing of change management controls',
      status: 'in_progress',
      priority: 'high',
      due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['ITGC', 'controls']
    },
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[0] || null,
      title: 'Partner review meeting',
      description: 'Schedule and prepare for partner review of audit status',
      status: 'todo',
      priority: 'high',
      due_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['meeting', 'partner-review']
    },
    {
      project_id: projectIds[0],
      workstream_id: workstreamIds?.[0] || null,
      title: 'Update audit timeline',
      description: 'Revise project timeline based on current progress',
      status: 'completed',
      priority: 'low',
      due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['planning', 'timeline']
    }
  ];

  const { data, error } = await supabase.from('tasks').insert(tasks).select();
  if (error) {
    console.error('Error seeding tasks:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} tasks`);
  return data;
}

async function seedEngagementActivity() {
  console.log('Seeding engagement activity...');

  const now = new Date();
  const activities = [];
  const activityTypes = [
    { type: 'status_change', description: 'Status changed from Planning to In Progress' },
    { type: 'workpaper_created', description: 'Created workpaper: Revenue Testing Summary' },
    { type: 'finding_added', description: 'New finding identified: Control Deficiency' },
    { type: 'review_completed', description: 'Manager review completed for Cash section' },
    { type: 'comment_added', description: 'Added review note on AR confirmation' },
    { type: 'document_uploaded', description: 'Uploaded bank confirmation response' },
    { type: 'time_logged', description: 'Logged 4 hours for revenue testing' },
    { type: 'milestone_reached', description: 'Fieldwork 50% complete' }
  ];

  // Generate activity for past 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // 3-6 activities per day
    const numActivities = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numActivities; i++) {
      const engagementId = [AUDIT_IDS.aud1, AUDIT_IDS.aud2, AUDIT_IDS.aud3][Math.floor(Math.random() * 3)];
      const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];

      activities.push({
        firm_id: FIRM_IDS.obsidian,
        engagement_id: engagementId,
        activity_type: activity.type,
        description: activity.description,
        metadata: { automated: false },
        created_at: date.toISOString()
      });
    }
  }

  const { data, error } = await supabase.from('engagement_activity').insert(activities).select();
  if (error) {
    console.error('Error seeding engagement activity:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} activity entries`);
  return data;
}

async function seedConfirmations() {
  console.log('Seeding confirmations...');

  // Valid status values: 'pending', 'sent', 'received', 'exception', 'alternative_procedures', 'resolved'
  // Valid exception_type values: 'timing_difference', 'amount_difference', 'disputed_item', 'unknown_account', 'other'
  const confirmations = [
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'bank_account',
      account_name: 'First National Bank - Operating',
      account_number: '1234567890',
      balance_per_books: 8500000,
      as_of_date: '2024-12-31',
      request_sent_date: '2024-11-15',
      request_sent_to: 'confirmations@fnb.example.com',
      response_received_date: '2024-11-28',
      response_method: 'mail',
      balance_per_confirmation: 8500000,
      confirmation_agrees: true,
      status: 'resolved',
      workpaper_reference: 'WP-B-001'
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'bank_account',
      account_name: 'City Commercial Bank - Payroll',
      account_number: '9876543210',
      balance_per_books: 2150000,
      as_of_date: '2024-12-31',
      request_sent_date: '2024-11-15',
      request_sent_to: 'audit@ccb.example.com',
      response_received_date: '2024-12-02',
      response_method: 'portal',
      balance_per_confirmation: 2150000,
      confirmation_agrees: true,
      status: 'resolved',
      workpaper_reference: 'WP-B-002'
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'accounts_receivable',
      account_name: 'ABC Corporation',
      account_number: 'AR-001',
      balance_per_books: 475000,
      as_of_date: '2024-12-31',
      request_sent_date: '2024-12-01',
      request_sent_to: 'ap@abccorp.example.com',
      response_received_date: '2024-12-10',
      response_method: 'mail',
      balance_per_confirmation: 450000,
      confirmation_agrees: false,
      exception_amount: 25000,
      exception_type: 'timing_difference',
      exception_resolved: true,
      exception_resolution: 'Payment in transit confirmed',
      status: 'resolved',
      workpaper_reference: 'WP-A-002'
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'accounts_receivable',
      account_name: 'XYZ Industries',
      account_number: 'AR-002',
      balance_per_books: 890000,
      as_of_date: '2024-12-31',
      request_sent_date: '2024-12-01',
      request_sent_to: 'accounting@xyz.example.com',
      reminder_sent_dates: ['2024-12-15'],
      status: 'sent',
      workpaper_reference: 'WP-A-002'
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'accounts_receivable',
      account_name: 'Global Enterprises',
      account_number: 'AR-003',
      balance_per_books: 675000,
      as_of_date: '2024-12-31',
      request_sent_date: '2024-12-01',
      request_sent_to: 'finance@globalent.example.com',
      reminder_sent_dates: ['2024-12-10', '2024-12-17'],
      alternative_procedures_performed: 'Vouched subsequent receipts and reviewed supporting contracts.',
      alternative_procedures_result: 'Subsequent receipts verified for $500,000. Remaining balance supported by contracts.',
      alternative_procedures_date: '2024-12-20',
      status: 'alternative_procedures',
      workpaper_reference: 'WP-A-002'
    },
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      confirmation_type: 'legal_letter',
      account_name: 'Smith & Associates LLP - Legal Counsel',
      balance_per_books: 0,
      as_of_date: '2024-12-31',
      request_sent_date: '2024-11-20',
      request_sent_to: 'litigation@smithlaw.example.com',
      response_received_date: '2024-12-05',
      response_method: 'mail',
      confirmation_agrees: true,
      status: 'resolved',
      workpaper_reference: 'WP-L-001'
    }
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
    console.error('Error seeding confirmations:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} confirmations`);
  return data;
}

async function seedMaterialityCalculations() {
  console.log('Seeding materiality calculations...');

  if (!DEMO_USER_ID) {
    console.log('  ⚠ Skipping materiality - no auth user for created_by');
    return [];
  }

  const calculations = [
    {
      engagement_id: AUDIT_IDS.aud1,
      created_by: DEMO_USER_ID,
      benchmark_type: 'total_revenue',
      benchmark_amount: 500000000,
      benchmark_description: 'Total revenues for fiscal year 2024',
      overall_materiality: 2500000,
      performance_materiality: 1875000,
      clearly_trivial_threshold: 125000,
      overall_percentage: 0.5,
      performance_percentage: 75,
      trivial_percentage: 5,
      rationale: 'Based on 0.5% of total revenue, consistent with prior year and industry practice.',
      risk_factors: ['No prior misstatements', 'Established client relationship', 'Medium industry risk'],
      is_active: true
    },
    {
      engagement_id: AUDIT_IDS.aud2,
      created_by: DEMO_USER_ID,
      benchmark_type: 'total_assets',
      benchmark_amount: 75000000,
      benchmark_description: 'Total assets as of year-end',
      overall_materiality: 750000,
      performance_materiality: 562500,
      clearly_trivial_threshold: 37500,
      overall_percentage: 1.0,
      performance_percentage: 75,
      trivial_percentage: 5,
      rationale: 'Based on 1% of total assets for this growth-stage technology company.',
      risk_factors: ['New client - first year audit', 'High growth industry', 'IPO planned'],
      is_active: true
    },
    {
      engagement_id: AUDIT_IDS.aud3,
      created_by: DEMO_USER_ID,
      benchmark_type: 'total_revenue',
      benchmark_amount: 850000000,
      benchmark_description: 'Total patient revenue for fiscal year 2024',
      overall_materiality: 4250000,
      performance_materiality: 3187500,
      clearly_trivial_threshold: 212500,
      overall_percentage: 0.5,
      performance_percentage: 75,
      trivial_percentage: 5,
      rationale: 'Healthcare entity - using revenue benchmark consistent with regulated entities.',
      risk_factors: ['HIPAA compliance requirements', 'High regulatory scrutiny', 'Complex revenue streams'],
      is_active: true
    }
  ];

  const { data, error } = await supabase.from('materiality_calculations').insert(calculations).select();
  if (error) {
    console.error('Error seeding materiality:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} materiality calculations`);
  return data;
}

// ============================================================
// SEED PROJECTS AND WORKSTREAMS
// ============================================================

async function seedProjects() {
  console.log('Seeding projects...');

  const now = new Date();
  // Note: projects table doesn't have organization_id column - just user_id
  const projects = [
    {
      user_id: DEMO_USER_ID,
      name: 'Acme Corp FY2024 Audit',
      client: 'Acme Corporation',
      description: 'Annual financial statement audit for fiscal year 2024',
      status: 'In Progress',
      progress: 65,
      budget: 150000,
      spent: 85000,
      start_date: '2024-10-01',
      due_date: '2025-02-28',
      priority: 'high'
    },
    {
      user_id: DEMO_USER_ID,
      name: 'TechStart IPO Readiness',
      client: 'TechStart Industries',
      description: 'IPO readiness assessment and SOX compliance review',
      status: 'In Progress',
      progress: 40,
      budget: 200000,
      spent: 55000,
      start_date: '2024-11-01',
      due_date: '2025-04-30',
      priority: 'high'
    },
    {
      user_id: DEMO_USER_ID,
      name: 'HealthCare Plus HIPAA Audit',
      client: 'HealthCare Plus',
      description: 'HIPAA compliance audit and security assessment',
      status: 'In Progress',
      progress: 70,
      budget: 125000,
      spent: 78000,
      start_date: '2024-09-15',
      due_date: '2025-01-31',
      priority: 'high'
    },
    {
      user_id: DEMO_USER_ID,
      name: 'Green Energy Tax Review',
      client: 'Green Energy Solutions',
      description: 'Annual tax return review and planning',
      status: 'Completed',
      progress: 100,
      budget: 45000,
      spent: 42000,
      start_date: '2024-08-01',
      due_date: '2024-11-30',
      priority: 'medium'
    }
  ];

  const { data, error } = await supabase.from('projects').insert(projects).select();
  if (error) {
    console.error('Error seeding projects:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} projects`);
  return data;
}

async function seedWorkstreams(projectIds) {
  console.log('Seeding workstreams...');

  if (!projectIds || projectIds.length === 0) {
    console.log('  ⚠ Skipping workstreams - no projects available');
    return [];
  }

  // Valid status: 'active', 'on_hold', 'completed', 'archived'
  const workstreams = [
    {
      project_id: projectIds[0],
      name: 'Planning Phase',
      description: 'Audit planning and risk assessment',
      status: 'completed',
      start_date: '2024-10-01',
      end_date: '2024-10-31',
      order_index: 1,
      color: '#3B82F6'
    },
    {
      project_id: projectIds[0],
      name: 'Fieldwork',
      description: 'Substantive testing and control testing',
      status: 'active',
      start_date: '2024-11-01',
      end_date: '2025-01-31',
      order_index: 2,
      color: '#10B981'
    },
    {
      project_id: projectIds[0],
      name: 'Wrap-up & Reporting',
      description: 'Final procedures and report issuance',
      status: 'on_hold',
      start_date: '2025-02-01',
      end_date: '2025-02-28',
      order_index: 3,
      color: '#F59E0B'
    },
    {
      project_id: projectIds.length > 1 ? projectIds[1] : projectIds[0],
      name: 'IT Controls Assessment',
      description: 'ITGC and application controls testing',
      status: 'active',
      start_date: '2024-11-01',
      end_date: '2025-02-28',
      order_index: 1,
      color: '#8B5CF6'
    }
  ];

  const { data, error } = await supabase.from('workstreams').insert(workstreams).select();
  if (error) {
    console.error('Error seeding workstreams:', error.message);
    return [];
  }
  console.log(`  ✓ Created ${data.length} workstreams`);
  return data;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('COMPREHENSIVE DEMO DATA SEEDING');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Create auth users first (required for foreign keys)
    await createDemoAuthUser();
    await seedDemoProfile();
    const teamUserIds = await createAdditionalUsers();

    // Step 2: Seed clients and link to audits
    const clients = await seedClients();
    await updateAuditsWithClients(clients);

    // Step 3: Seed projects, workstreams, tasks (now we have user_id)
    const projects = await seedProjects();
    const projectIds = projects.map(p => p.id);

    const workstreams = await seedWorkstreams(projectIds);
    const workstreamIds = workstreams.map(w => w.id);

    const tasks = await seedTasks(projectIds, workstreamIds);
    const taskIds = tasks.map(t => t.id);

    // Step 4: Seed risks and time entries (depend on projects)
    await seedRisks(projectIds);
    await seedTimeEntries(projectIds, taskIds);

    // Step 5: Seed audit-specific data
    await seedAuditPrograms();
    await seedMoreWorkpapers();
    await seedMoreFindings();
    await seedEngagementActivity();

    // Step 6: Seed confirmations and materiality (now we have created_by)
    await seedConfirmations();
    await seedMaterialityCalculations();

    console.log('');
    console.log('='.repeat(60));
    console.log('SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Demo data created:');
    console.log('  • 4 team members (demo, manager, partner, staff)');
    console.log('  • 8 clients across various industries');
    console.log('  • 5 audits linked to clients');
    console.log('  • 4 projects with workstreams');
    console.log('  • 8 tasks in various states');
    console.log('  • 4 risk assessments');
    console.log('  • 60+ time entries');
    console.log('  • 6 audit programs with testing details');
    console.log('  • 6 additional workpapers');
    console.log('  • 4 additional findings');
    console.log('  • 6 confirmations');
    console.log('  • 3 materiality calculations');
    console.log('  • 100+ activity log entries');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: demo@obsidian-audit.com');
    console.log('  Password: demo123456');
    console.log('');
    console.log('Refresh the app to see the data!');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
