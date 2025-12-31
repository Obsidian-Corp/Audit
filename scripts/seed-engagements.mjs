/**
 * SEED ADDITIONAL ENGAGEMENTS
 * ============================
 * Creates more audit engagements with correct schema values
 */

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic";
const BASE_URL = "https://qtsvdeauuawfewdzbflr.supabase.co/rest/v1";
const FIRM_ID = "00000000-0000-0000-0000-000000000001";

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    throw new Error(`Failed to insert: ${error}`);
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

async function main() {
  console.log('=== Creating Additional Engagements ===\n');

  // Get existing data
  const clients = await supabaseGet('clients', `?select=id,client_name&firm_id=eq.${FIRM_ID}&limit=30`);
  const profiles = await supabaseGet('profiles', '?select=id,first_name,last_name');

  console.log(`Found ${clients.length} clients and ${profiles.length} profiles\n`);

  // Valid values based on schema constraints
  const validPhases = ['planning', 'fieldwork', 'review', 'reporting', 'complete'];
  const validStatuses = ['planning', 'fieldwork', 'review', 'in_progress', 'completed'];
  const validPriorities = ['low', 'medium', 'high'];
  const validRiskRatings = ['low', 'medium', 'high'];
  const auditTypes = ['financial', 'operational', 'compliance', 'it'];

  const engagements = [];

  // Create engagements across different scenarios
  const scenarios = [
    // 2023 Completed Audits
    { year: 2023, status: 'completed', phase: 'complete', title: 'Annual Financial Statement Audit' },
    { year: 2023, status: 'completed', phase: 'complete', title: 'SOX 404 Compliance Audit' },
    { year: 2023, status: 'completed', phase: 'complete', title: 'IT General Controls Review' },

    // 2024 In-Progress Audits
    { year: 2024, status: 'fieldwork', phase: 'fieldwork', title: 'Annual Financial Statement Audit' },
    { year: 2024, status: 'review', phase: 'review', title: 'Quarterly Compliance Review - Q3' },
    { year: 2024, status: 'planning', phase: 'planning', title: 'IT Security Assessment' },
    { year: 2024, status: 'fieldwork', phase: 'fieldwork', title: 'Internal Controls Testing' },
    { year: 2024, status: 'reporting', phase: 'reporting', title: 'Operational Efficiency Audit' },

    // Current Year Engagements
    { year: 2025, status: 'planning', phase: 'planning', title: 'Annual Financial Statement Audit' },
    { year: 2025, status: 'planning', phase: 'planning', title: 'SOX Readiness Assessment' },
    { year: 2025, status: 'in_progress', phase: 'planning', title: 'Data Privacy Compliance Review' },
    { year: 2025, status: 'planning', phase: 'planning', title: 'Cybersecurity Risk Assessment' }
  ];

  for (let i = 0; i < scenarios.length && i < clients.length; i++) {
    const scenario = scenarios[i];
    const client = clients[i];
    const partner = profiles[Math.floor(Math.random() * profiles.length)];
    const manager = profiles[Math.floor(Math.random() * profiles.length)];

    const auditType = auditTypes[Math.floor(Math.random() * auditTypes.length)];
    const auditNumber = `AUD-${scenario.year}-${String(100 + i).padStart(3, '0')}`;

    const startDate = new Date(scenario.year, Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    const budgetHours = Math.floor(Math.random() * 300) + 100;
    const hoursSpent = scenario.status === 'completed'
      ? budgetHours + Math.floor(Math.random() * 50) - 25
      : Math.floor(Math.random() * budgetHours * 0.7);

    engagements.push({
      id: uuid(),
      firm_id: FIRM_ID,
      client_id: client.id,
      audit_title: `FY${scenario.year} ${scenario.title} - ${client.client_name}`,
      audit_number: auditNumber,
      audit_type: auditType,
      status: scenario.status,
      current_phase: scenario.phase,
      planned_start_date: startDate.toISOString().split('T')[0],
      planned_end_date: endDate.toISOString().split('T')[0],
      budget_hours: budgetHours,
      hours_spent: hoursSpent,
      lead_auditor_id: partner?.id || null,
      manager_id: manager?.id || null,
      priority: validPriorities[Math.floor(Math.random() * validPriorities.length)],
      risk_rating: validRiskRatings[Math.floor(Math.random() * validRiskRatings.length)]
    });
  }

  try {
    const result = await supabasePost('audits', engagements);
    console.log(`✓ Created ${result.length} new engagements\n`);

    // List created engagements
    for (const eng of result) {
      console.log(`  - ${eng.audit_number}: ${eng.audit_title.slice(0, 50)}...`);
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }

  // Final count
  const finalCount = await supabaseGet('audits', '?select=count');
  console.log(`\nTotal engagements: ${finalCount[0]?.count}`);
}

main();
