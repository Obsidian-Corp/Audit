// Database Inventory Script
// Counts all records in all tables to identify empty states

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic";
const BASE_URL = "https://qtsvdeauuawfewdzbflr.supabase.co/rest/v1";

const tables = [
  // Core tables
  "firms",
  "profiles",
  "user_roles",

  // Client management
  "clients",
  "client_contacts",

  // Engagement/Audit tables
  "audits",
  "audit_findings",
  "confirmations",
  "materiality_calculations",
  "risks",

  // Procedure & Program tables
  "audit_programs",
  "audit_program_steps",
  "audit_procedures",
  "engagement_procedures",
  "procedure_templates",

  // Workpaper tables
  "audit_workpapers",
  "workpaper_templates",
  "audit_samples",

  // Task & Time tables
  "tasks",
  "time_entries",

  // Review & Activity tables
  "review_notes",
  "engagement_activity",

  // Documents & Projects
  "documents",
  "projects",
];

async function countTable(table) {
  try {
    const response = await fetch(`${BASE_URL}/${table}?select=count`, {
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`
      }
    });

    if (!response.ok) {
      return { table, count: "NOT_FOUND", status: response.status };
    }

    const data = await response.json();
    return { table, count: data[0]?.count || 0 };
  } catch (error) {
    return { table, count: "ERROR", error: error.message };
  }
}

async function main() {
  console.log("=== COMPREHENSIVE DATABASE INVENTORY ===");
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("");

  const results = await Promise.all(tables.map(countTable));

  // Group by category
  const categories = {
    "Core": ["firms", "profiles", "user_roles"],
    "Clients": ["clients", "client_contacts"],
    "Engagements": ["audits", "audit_findings", "confirmations", "materiality_calculations", "risks"],
    "Programs & Procedures": ["audit_programs", "audit_program_steps", "audit_procedures", "engagement_procedures", "procedure_templates"],
    "Workpapers": ["audit_workpapers", "workpaper_templates", "audit_samples"],
    "Tasks & Time": ["tasks", "time_entries"],
    "Review & Activity": ["review_notes", "engagement_activity"],
    "Documents": ["documents", "projects"]
  };

  let emptyTables = [];
  let populatedTables = [];

  for (const [category, tableNames] of Object.entries(categories)) {
    console.log(`\n--- ${category} ---`);
    for (const tableName of tableNames) {
      const result = results.find(r => r.table === tableName);
      if (result) {
        const countStr = typeof result.count === 'number'
          ? result.count.toString().padStart(6)
          : result.count.padStart(6);
        console.log(`  ${tableName.padEnd(25)} ${countStr}`);

        if (result.count === 0) {
          emptyTables.push(tableName);
        } else if (typeof result.count === 'number' && result.count > 0) {
          populatedTables.push({ table: tableName, count: result.count });
        }
      }
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`\nEmpty tables (${emptyTables.length}):`);
  emptyTables.forEach(t => console.log(`  - ${t}`));

  console.log(`\nPopulated tables (${populatedTables.length}):`);
  populatedTables.sort((a, b) => b.count - a.count);
  populatedTables.forEach(t => console.log(`  - ${t.table}: ${t.count}`));

  console.log("\n=== END INVENTORY ===");
}

main().catch(console.error);
