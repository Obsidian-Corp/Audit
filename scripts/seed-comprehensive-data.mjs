/**
 * COMPREHENSIVE SEED DATA SCRIPT
 * ================================
 * This script seeds the Obsidian Audit Platform with realistic data for UAT testing.
 *
 * Database Inventory (Before):
 * - firms: 3 ✓
 * - profiles: 4 (need ~15)
 * - clients: 89 ✓
 * - audits: 5 (need ~18)
 * - audit_findings: 48 ✓
 * - confirmations: 38 ✓
 * - tasks: 24 ✓
 * - time_entries: 195 ✓
 * - audit_programs: 60 ✓
 * - audit_procedures: 255 ✓
 * - audit_workpapers: 90 ✓
 *
 * EMPTY TABLES TO FILL:
 * - client_contacts: 0
 * - engagement_procedures: 0 (requires engagement_programs first)
 * - engagement_programs: 0
 */

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic";
const BASE_URL = "https://qtsvdeauuawfewdzbflr.supabase.co/rest/v1";

// Constants
const FIRM_ID = "00000000-0000-0000-0000-000000000001";

// Helper function to generate UUIDs
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// API helper
async function supabasePost(table, data) {
  const response = await fetch(`${BASE_URL}/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert into ${table}: ${error}`);
  }

  return response.json();
}

async function supabaseGet(table, params = '') {
  const response = await fetch(`${BASE_URL}/${table}${params}`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  return response.json();
}

// =========================================================================
// PHASE 1: Get existing data references
// =========================================================================

async function getExistingData() {
  console.log('\n📊 Fetching existing data references...');

  const profiles = await supabaseGet('profiles', '?select=id,first_name,last_name,email');
  const clients = await supabaseGet('clients', `?select=id,client_name,firm_id&firm_id=eq.${FIRM_ID}`);
  const audits = await supabaseGet('audits', '?select=id,audit_title,audit_number,client_id,firm_id');
  const workpapers = await supabaseGet('audit_workpapers', '?select=id,audit_id,reference_number,title');
  const auditProcedures = await supabaseGet('audit_procedures', `?select=id,procedure_name,procedure_code&firm_id=eq.${FIRM_ID}&limit=50`);

  console.log(`  Profiles: ${profiles.length}`);
  console.log(`  Clients: ${clients.length}`);
  console.log(`  Audits: ${audits.length}`);
  console.log(`  Workpapers: ${workpapers.length}`);
  console.log(`  Audit Procedures: ${auditProcedures.length}`);

  return { profiles, clients, audits, workpapers, auditProcedures };
}

// =========================================================================
// PHASE 2: Create Additional Team Members (Profiles)
// =========================================================================

async function createAdditionalProfiles(existingProfiles) {
  console.log('\n👥 Creating additional team member profiles...');

  // Check existing profile emails to avoid duplicates
  const existingEmails = new Set(existingProfiles.map(p => p.email?.toLowerCase()));

  // Use 'title' instead of 'job_title' based on actual schema
  const newProfiles = [
    { first_name: 'Emily', last_name: 'Chen', email: 'emily.chen@obsidian-audit.com', title: 'Senior Auditor' },
    { first_name: 'Marcus', last_name: 'Johnson', email: 'marcus.johnson@obsidian-audit.com', title: 'Audit Manager' },
    { first_name: 'Priya', last_name: 'Patel', email: 'priya.patel@obsidian-audit.com', title: 'Staff Auditor' },
    { first_name: 'James', last_name: 'Wilson', email: 'james.wilson@obsidian-audit.com', title: 'Senior Associate' },
    { first_name: 'Sofia', last_name: 'Rodriguez', email: 'sofia.rodriguez@obsidian-audit.com', title: 'IT Audit Specialist' },
    { first_name: 'David', last_name: 'Kim', email: 'david.kim@obsidian-audit.com', title: 'Audit Partner' },
    { first_name: 'Rachel', last_name: 'Thompson', email: 'rachel.thompson@obsidian-audit.com', title: 'Risk Analyst' },
    { first_name: 'Andrew', last_name: 'Martinez', email: 'andrew.martinez@obsidian-audit.com', title: 'Staff Auditor' },
    { first_name: 'Lisa', last_name: 'Brown', email: 'lisa.brown@obsidian-audit.com', title: 'Audit Senior' },
    { first_name: 'Kevin', last_name: 'Lee', email: 'kevin.lee@obsidian-audit.com', title: 'Internal Controls Specialist' },
    { first_name: 'Jennifer', last_name: 'Davis', email: 'jennifer.davis@obsidian-audit.com', title: 'Audit Manager' }
  ].filter(p => !existingEmails.has(p.email.toLowerCase()));

  const createdProfiles = [];

  for (const profile of newProfiles) {
    try {
      const id = uuid();
      const result = await supabasePost('profiles', {
        id,
        ...profile,
        firm_id: FIRM_ID,
        is_active: true
      });
      createdProfiles.push(result[0]);
      console.log(`  ✓ Created profile: ${profile.first_name} ${profile.last_name}`);
    } catch (err) {
      console.log(`  ⚠ Skipping ${profile.email}: ${err.message}`);
    }
  }

  console.log(`  Created ${createdProfiles.length} new profiles`);
  return createdProfiles;
}

// =========================================================================
// PHASE 3: Create Client Contacts
// =========================================================================

async function createClientContacts(clients) {
  console.log('\n📇 Creating client contacts...');

  const contactTypes = ['CFO', 'Controller', 'Accounting Manager', 'IT Director', 'CEO', 'Internal Audit Director'];
  const contacts = [];

  // Take top 20 clients to add contacts
  const clientsToProcess = clients.slice(0, 20);

  for (const client of clientsToProcess) {
    // Create 2-3 contacts per client
    const numContacts = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < numContacts; i++) {
      const firstName = ['John', 'Sarah', 'Michael', 'Lisa', 'Robert', 'Jennifer', 'William', 'Amanda'][Math.floor(Math.random() * 8)];
      const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][Math.floor(Math.random() * 8)];
      const title = contactTypes[Math.floor(Math.random() * contactTypes.length)];

      contacts.push({
        id: uuid(),
        client_id: client.id,
        first_name: firstName,
        last_name: lastName,
        title,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${client.client_name?.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        is_primary: i === 0
      });
    }
  }

  try {
    await supabasePost('client_contacts', contacts);
    console.log(`  ✓ Created ${contacts.length} client contacts`);
    return contacts;
  } catch (err) {
    console.log(`  ⚠ Error creating contacts: ${err.message}`);
    return [];
  }
}

// =========================================================================
// PHASE 4: Create More Engagements
// =========================================================================

async function createAdditionalEngagements(clients, profiles) {
  console.log('\n📋 Creating additional engagements...');

  // Use 'audit_type' instead of 'engagement_type' based on actual schema
  const engagementTypes = [
    { type: 'financial', prefix: 'FSA', title: 'Financial Statement Audit' },
    { type: 'sox', prefix: 'SOX', title: 'SOX Compliance Audit' },
    { type: 'it', prefix: 'ITC', title: 'IT Controls Review' },
    { type: 'internal', prefix: 'INT', title: 'Internal Audit' },
    { type: 'aup', prefix: 'AUP', title: 'Agreed-Upon Procedures' },
    { type: 'compilation', prefix: 'CMP', title: 'Compilation' },
    { type: 'review', prefix: 'REV', title: 'Review Engagement' }
  ];

  const statuses = ['planning', 'fieldwork', 'review', 'in_progress', 'completed'];
  const phases = ['planning', 'risk_assessment', 'interim', 'final', 'wrap_up'];

  const newEngagements = [];

  // Create 15 more engagements
  for (let i = 0; i < 15; i++) {
    const client = clients[Math.floor(Math.random() * Math.min(clients.length, 30))];
    const engType = engagementTypes[Math.floor(Math.random() * engagementTypes.length)];
    const year = 2023 + Math.floor(Math.random() * 2); // 2023 or 2024
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Get random partner and manager from profiles
    const partner = profiles[Math.floor(Math.random() * profiles.length)];
    const manager = profiles[Math.floor(Math.random() * profiles.length)];

    const auditNumber = `${engType.prefix}-${year}-${String(i + 10).padStart(3, '0')}`;
    const startDate = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 4) + 1);

    const budgetHours = Math.floor(Math.random() * 400) + 100;
    const hoursSpent = status === 'completed' ? budgetHours : Math.floor(Math.random() * budgetHours);

    newEngagements.push({
      id: uuid(),
      audit_title: `FY${year} ${engType.title} - ${client.client_name}`,
      audit_number: auditNumber,
      audit_type: engType.type,
      client_id: client.id,
      firm_id: FIRM_ID,
      status,
      current_phase: phases[Math.floor(Math.random() * phases.length)],
      engagement_phase: phases[Math.floor(Math.random() * phases.length)],
      lead_auditor_id: partner?.id,
      manager_id: manager?.id,
      planned_start_date: startDate.toISOString().split('T')[0],
      planned_end_date: endDate.toISOString().split('T')[0],
      budget_hours: budgetHours,
      hours_spent: hoursSpent,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      risk_rating: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    });
  }

  try {
    const result = await supabasePost('audits', newEngagements);
    console.log(`  ✓ Created ${result.length} new engagements`);
    return result;
  } catch (err) {
    console.log(`  ⚠ Error creating engagements: ${err.message}`);
    return [];
  }
}

// =========================================================================
// PHASE 5: Create Engagement Programs
// =========================================================================

async function createEngagementPrograms(audits, profiles) {
  console.log('\n📚 Creating engagement programs...');

  const programNames = [
    'Cash and Cash Equivalents',
    'Accounts Receivable',
    'Revenue Recognition',
    'Accounts Payable',
    'Inventory',
    'Fixed Assets',
    'Payroll and Benefits',
    'Income Taxes',
    'General IT Controls',
    'Access Controls',
    'Change Management',
    'Segregation of Duties',
    'Journal Entry Testing',
    'Related Party Transactions',
    'Subsequent Events'
  ];

  const statuses = ['not_started', 'in_progress', 'completed', 'under_review'];
  const programs = [];

  // Create 3-5 programs per audit
  for (const audit of audits) {
    const numPrograms = Math.floor(Math.random() * 3) + 3;
    const selectedPrograms = [...programNames].sort(() => Math.random() - 0.5).slice(0, numPrograms);

    for (const programName of selectedPrograms) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const totalProcedures = Math.floor(Math.random() * 15) + 5;
      const completedProcedures = status === 'completed'
        ? totalProcedures
        : Math.floor(Math.random() * totalProcedures);

      programs.push({
        id: uuid(),
        engagement_id: audit.id,
        program_name: programName,
        status,
        total_procedures: totalProcedures,
        completed_procedures: completedProcedures,
        created_by: profiles[Math.floor(Math.random() * profiles.length)]?.id
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      await supabasePost('engagement_programs', batch);
      inserted += batch.length;
    }

    console.log(`  ✓ Created ${inserted} engagement programs`);
    return programs;
  } catch (err) {
    console.log(`  ⚠ Error creating engagement programs: ${err.message}`);
    return [];
  }
}

// =========================================================================
// PHASE 6: Create Engagement Procedures
// =========================================================================

async function createEngagementProcedures(engagementPrograms, auditProcedures, profiles) {
  console.log('\n📑 Creating engagement procedures...');

  if (!engagementPrograms || engagementPrograms.length === 0) {
    console.log('  ⚠ No engagement programs found to create procedures for');
    return [];
  }

  const statuses = ['not_started', 'in_progress', 'completed', 'blocked', 'skipped'];
  const priorities = ['high', 'medium', 'low'];
  const reviewStatuses = ['pending', 'approved', 'needs_revision'];

  const procedures = [];

  for (const program of engagementPrograms) {
    // Create 3-8 procedures per program
    const numProcedures = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < numProcedures; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const assignee = profiles[Math.floor(Math.random() * profiles.length)];
      const reviewer = profiles[Math.floor(Math.random() * profiles.length)];
      const linkedProcedure = auditProcedures[Math.floor(Math.random() * auditProcedures.length)];

      const procedureNames = [
        'Test cash reconciliation',
        'Verify bank confirmations',
        'Sample invoice testing',
        'Cutoff testing',
        'Review management estimates',
        'Analytical procedures',
        'Inquiry of management',
        'Walkthroughs',
        'Test of controls',
        'Substantive testing'
      ];

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30));

      const estimatedHours = Math.floor(Math.random() * 8) + 1;
      const actualHours = status === 'completed' ? estimatedHours + (Math.random() * 2 - 1) : 0;

      procedures.push({
        id: uuid(),
        engagement_id: program.engagement_id,
        engagement_program_id: program.id,
        procedure_id: linkedProcedure?.id,
        procedure_name: procedureNames[Math.floor(Math.random() * procedureNames.length)] + ` - ${program.program_name.slice(0, 10)}`,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assigned_to: assignee?.id,
        assigned_by: profiles[Math.floor(Math.random() * profiles.length)]?.id,
        due_date: dueDate.toISOString().split('T')[0],
        estimated_hours: estimatedHours,
        actual_hours: actualHours > 0 ? actualHours : null,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        review_status: status === 'completed' ? reviewStatuses[Math.floor(Math.random() * reviewStatuses.length)] : null,
        reviewed_by: status === 'completed' ? reviewer?.id : null,
        reviewed_at: status === 'completed' ? new Date().toISOString() : null,
        review_notes: status === 'completed' ? 'Reviewed and approved. Work meets professional standards.' : null,
        conclusion: status === 'completed' ? 'Testing completed satisfactorily. No exceptions noted.' : null,
        exceptions_noted: Math.random() > 0.9 ? 'Minor exception noted - see workpaper for details' : null,
        instructions: {
          steps: [
            'Obtain relevant documentation',
            'Perform testing procedures',
            'Document results',
            'Conclude on findings'
          ]
        }
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < procedures.length; i += batchSize) {
      const batch = procedures.slice(i, i + batchSize);
      await supabasePost('engagement_procedures', batch);
      inserted += batch.length;
      console.log(`    Inserted batch ${Math.floor(i / batchSize) + 1}...`);
    }

    console.log(`  ✓ Created ${inserted} engagement procedures`);
    return procedures;
  } catch (err) {
    console.log(`  ⚠ Error creating engagement procedures: ${err.message}`);
    return [];
  }
}

// =========================================================================
// PHASE 7: Create More Time Entries
// =========================================================================

async function createMoreTimeEntries(audits, profiles) {
  console.log('\n⏱️ Creating additional time entries...');

  const activities = [
    'Planning meeting',
    'Client walkthrough',
    'Document review',
    'Substantive testing',
    'Control testing',
    'Workpaper preparation',
    'Manager review',
    'Partner review',
    'Client follow-up',
    'Draft findings',
    'Exit meeting preparation'
  ];

  const timeEntries = [];

  for (const audit of audits) {
    // Create 10-20 time entries per audit
    const numEntries = Math.floor(Math.random() * 11) + 10;

    for (let i = 0; i < numEntries; i++) {
      const profile = profiles[Math.floor(Math.random() * profiles.length)];
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - Math.floor(Math.random() * 60));

      timeEntries.push({
        id: uuid(),
        audit_id: audit.id,
        firm_id: FIRM_ID,
        user_id: profile?.id,
        activity_type: activities[Math.floor(Math.random() * activities.length)],
        hours: Math.floor(Math.random() * 80 + 10) / 10, // 1.0 to 9.0 hours
        billable: Math.random() > 0.1,
        date: entryDate.toISOString().split('T')[0],
        description: `${activities[Math.floor(Math.random() * activities.length)]} for ${audit.audit_title?.slice(0, 30)}`,
        status: ['draft', 'submitted', 'approved'][Math.floor(Math.random() * 3)]
      });
    }
  }

  try {
    // Insert in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < timeEntries.length; i += batchSize) {
      const batch = timeEntries.slice(i, i + batchSize);
      await supabasePost('time_entries', batch);
      inserted += batch.length;
    }

    console.log(`  ✓ Created ${inserted} time entries`);
    return timeEntries;
  } catch (err) {
    console.log(`  ⚠ Error creating time entries: ${err.message}`);
    return [];
  }
}

// =========================================================================
// MAIN
// =========================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' OBSIDIAN AUDIT PLATFORM - COMPREHENSIVE SEED DATA             ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\nTimestamp: ${new Date().toISOString()}`);
  console.log(`Target Firm: ${FIRM_ID}`);

  try {
    // Get existing data
    const { profiles, clients, audits, workpapers, auditProcedures } = await getExistingData();

    // Phase 2: Create additional profiles
    const newProfiles = await createAdditionalProfiles(profiles);
    const allProfiles = [...profiles, ...newProfiles];

    // Phase 3: Create client contacts (already done, skip if > 0)
    const existingContacts = await supabaseGet('client_contacts', '?select=count');
    if (existingContacts[0]?.count < 10) {
      await createClientContacts(clients);
    } else {
      console.log('\n📇 Skipping client contacts (already have ' + existingContacts[0]?.count + ')');
    }

    // Phase 4: Create additional engagements
    const newEngagements = await createAdditionalEngagements(clients, allProfiles);
    const allAudits = [...audits, ...newEngagements];

    // Phase 5: Create engagement programs
    const programs = await createEngagementPrograms(allAudits, allProfiles);

    // Phase 6: Create engagement procedures
    if (programs.length > 0) {
      await createEngagementProcedures(programs, auditProcedures, allProfiles);
    }

    // Phase 7: Create more time entries
    await createMoreTimeEntries(allAudits.slice(0, 10), allProfiles);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(' SEED DATA COMPLETE                                            ');
    console.log('═══════════════════════════════════════════════════════════════');

    // Final inventory
    console.log('\n📊 Running final inventory...');
    const finalInventory = await Promise.all([
      supabaseGet('profiles', '?select=count'),
      supabaseGet('client_contacts', '?select=count'),
      supabaseGet('audits', '?select=count'),
      supabaseGet('engagement_programs', '?select=count'),
      supabaseGet('engagement_procedures', '?select=count'),
      supabaseGet('time_entries', '?select=count')
    ]);

    console.log(`  Profiles:               ${finalInventory[0][0]?.count}`);
    console.log(`  Client Contacts:        ${finalInventory[1][0]?.count}`);
    console.log(`  Audits:                 ${finalInventory[2][0]?.count}`);
    console.log(`  Engagement Programs:    ${finalInventory[3][0]?.count}`);
    console.log(`  Engagement Procedures:  ${finalInventory[4][0]?.count}`);
    console.log(`  Time Entries:           ${finalInventory[5][0]?.count}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
