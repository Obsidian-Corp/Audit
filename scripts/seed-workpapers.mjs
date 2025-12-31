#!/usr/bin/env node

/**
 * Seed Workpapers for All Audits
 * Creates sample workpapers with rich content for demo purposes
 */

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic";
const SUPABASE_URL = "https://qtsvdeauuawfewdzbflr.supabase.co";
const FIRM_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_USER_ID = "950005d5-41d5-4f83-bf0b-efe32be1f055";

// Workpaper templates with rich HTML content
const workpaperTemplates = [
  {
    type: "analysis",
    templates: [
      {
        title: "Revenue Recognition Analysis",
        reference_suffix: "REV",
        content: {
          html: `<h2>Revenue Recognition Analysis</h2>
<h3>Objective</h3>
<p>To evaluate management's revenue recognition policies and ensure compliance with ASC 606.</p>

<h3>Scope</h3>
<ul>
<li>Review revenue contracts for proper identification of performance obligations</li>
<li>Test transaction price allocation methodology</li>
<li>Verify timing of revenue recognition</li>
</ul>

<h3>Work Performed</h3>
<p>Selected a sample of 25 revenue contracts representing 80% of total revenue. Performed the following procedures:</p>
<ol>
<li>Identified distinct performance obligations in each contract</li>
<li>Verified standalone selling prices used for allocation</li>
<li>Tested point-in-time vs. over-time recognition criteria</li>
</ol>

<h3>Findings</h3>
<p>No material exceptions noted. All sampled contracts were properly accounted for under ASC 606.</p>

<h3>Conclusion</h3>
<p>Revenue recognition policies are appropriate and consistently applied.</p>`,
          summary: "ASC 606 compliance review - no exceptions noted"
        }
      },
      {
        title: "Accounts Receivable Aging Analysis",
        reference_suffix: "AR",
        content: {
          html: `<h2>Accounts Receivable Aging Analysis</h2>
<h3>Objective</h3>
<p>To assess the collectability of accounts receivable and evaluate the adequacy of the allowance for doubtful accounts.</p>

<h3>Procedures</h3>
<ul>
<li>Obtained AR aging schedule as of period end</li>
<li>Tested mathematical accuracy of aging buckets</li>
<li>Sent confirmations for balances over $10,000</li>
<li>Evaluated historical collection patterns</li>
</ul>

<h3>Aging Summary</h3>
<table border="1" cellpadding="5">
<tr><th>Aging Bucket</th><th>Amount</th><th>% of Total</th></tr>
<tr><td>Current</td><td>$2,450,000</td><td>65%</td></tr>
<tr><td>31-60 days</td><td>$750,000</td><td>20%</td></tr>
<tr><td>61-90 days</td><td>$375,000</td><td>10%</td></tr>
<tr><td>Over 90 days</td><td>$188,000</td><td>5%</td></tr>
</table>

<h3>Conclusion</h3>
<p>Allowance of $95,000 appears adequate based on historical write-off rates.</p>`,
          summary: "AR aging reviewed - allowance adequate"
        }
      },
      {
        title: "Inventory Valuation Analysis",
        reference_suffix: "INV",
        content: {
          html: `<h2>Inventory Valuation Analysis</h2>
<h3>Objective</h3>
<p>To verify inventory is stated at the lower of cost or net realizable value.</p>

<h3>Procedures Performed</h3>
<ul>
<li>Observed physical inventory count</li>
<li>Tested cost accumulation for sample of items</li>
<li>Evaluated slow-moving and obsolete inventory</li>
<li>Tested NRV calculations for high-risk items</li>
</ul>

<h3>Observations</h3>
<p>Physical count procedures were well-controlled. Count teams followed proper procedures and discrepancies were investigated.</p>

<h3>Cost Testing Results</h3>
<p>All 30 items tested traced to supporting documentation without exception.</p>

<h3>Conclusion</h3>
<p>Inventory valuation is appropriate. No adjustments required.</p>`,
          summary: "Inventory properly valued at lower of cost or NRV"
        }
      }
    ]
  },
  {
    type: "testing",
    templates: [
      {
        title: "Controls Testing - Purchase to Pay",
        reference_suffix: "P2P",
        content: {
          html: `<h2>Controls Testing - Purchase to Pay Cycle</h2>
<h3>Control Objective</h3>
<p>All purchases are properly authorized, recorded, and paid in accordance with company policy.</p>

<h3>Key Controls Tested</h3>
<table border="1" cellpadding="5">
<tr><th>Control #</th><th>Description</th><th>Result</th></tr>
<tr><td>P2P-01</td><td>PO approval based on dollar thresholds</td><td>Effective</td></tr>
<tr><td>P2P-02</td><td>3-way match before payment</td><td>Effective</td></tr>
<tr><td>P2P-03</td><td>Vendor master file changes require approval</td><td>Exception noted</td></tr>
<tr><td>P2P-04</td><td>Segregation of duties between ordering and paying</td><td>Effective</td></tr>
</table>

<h3>Exception Details</h3>
<p><strong>Control P2P-03:</strong> 2 of 25 vendor changes tested lacked documented approval. Communicated to management.</p>

<h3>Conclusion</h3>
<p>Controls are generally effective with one exception requiring management attention.</p>`,
          summary: "P2P controls effective with 1 exception"
        }
      },
      {
        title: "Substantive Testing - Fixed Assets",
        reference_suffix: "FA",
        content: {
          html: `<h2>Substantive Testing - Fixed Assets</h2>
<h3>Objective</h3>
<p>To verify fixed assets exist, are properly valued, and depreciation is accurately calculated.</p>

<h3>Sample Selection</h3>
<p>Selected 15 additions and 10 disposals for testing, representing 75% of current year activity.</p>

<h3>Test Results</h3>
<h4>Additions Testing</h4>
<ul>
<li>All additions traced to invoices ✓</li>
<li>Useful lives consistent with policy ✓</li>
<li>Capitalization threshold properly applied ✓</li>
</ul>

<h4>Disposals Testing</h4>
<ul>
<li>Gains/losses properly calculated ✓</li>
<li>Assets removed from register ✓</li>
<li>Appropriate authorization obtained ✓</li>
</ul>

<h3>Depreciation Recalculation</h3>
<p>Recalculated depreciation for 20 assets. No material variances noted.</p>

<h3>Conclusion</h3>
<p>Fixed assets are properly stated. No adjustments required.</p>`,
          summary: "Fixed assets testing - no exceptions"
        }
      }
    ]
  },
  {
    type: "documentation",
    templates: [
      {
        title: "Planning Memorandum",
        reference_suffix: "PLAN",
        content: {
          html: `<h2>Audit Planning Memorandum</h2>
<h3>Engagement Overview</h3>
<p>This memorandum documents our understanding of the entity and the planned audit approach.</p>

<h3>Business Understanding</h3>
<ul>
<li>Industry: Manufacturing</li>
<li>Key products: Industrial equipment</li>
<li>Primary markets: North America, Europe</li>
<li>Regulatory environment: SEC registrant</li>
</ul>

<h3>Risk Assessment</h3>
<table border="1" cellpadding="5">
<tr><th>Risk Area</th><th>Assessment</th><th>Response</th></tr>
<tr><td>Revenue recognition</td><td>High</td><td>Extended substantive testing</td></tr>
<tr><td>Inventory valuation</td><td>Medium</td><td>Observe count, test NRV</td></tr>
<tr><td>Related party transactions</td><td>Low</td><td>Inquiry and confirmation</td></tr>
</table>

<h3>Materiality</h3>
<p>Overall materiality: $500,000 (1% of total assets)</p>
<p>Performance materiality: $375,000 (75% of overall)</p>

<h3>Timeline</h3>
<ul>
<li>Interim fieldwork: October 15-30</li>
<li>Year-end fieldwork: January 15 - February 15</li>
<li>Report issuance: March 1</li>
</ul>`,
          summary: "Audit planning and risk assessment"
        }
      },
      {
        title: "Management Representation Letter",
        reference_suffix: "REP",
        content: {
          html: `<h2>Management Representation Letter Documentation</h2>
<h3>Purpose</h3>
<p>To document the representations obtained from management as required by auditing standards.</p>

<h3>Key Representations</h3>
<ul>
<li>Financial statements fairly presented in accordance with GAAP</li>
<li>All transactions properly recorded</li>
<li>No unrecorded liabilities</li>
<li>Related party transactions disclosed</li>
<li>Subsequent events evaluated through report date</li>
<li>No known fraud or suspected fraud</li>
</ul>

<h3>Signatories</h3>
<p>Letter signed by CEO and CFO on [date].</p>

<h3>Conclusion</h3>
<p>Representations obtained are consistent with our audit findings.</p>`,
          summary: "Management rep letter obtained and reviewed"
        }
      }
    ]
  },
  {
    type: "review",
    templates: [
      {
        title: "Analytical Review - Income Statement",
        reference_suffix: "ANIS",
        content: {
          html: `<h2>Analytical Review - Income Statement</h2>
<h3>Objective</h3>
<p>To identify unusual fluctuations requiring additional audit attention.</p>

<h3>Year-over-Year Comparison</h3>
<table border="1" cellpadding="5">
<tr><th>Account</th><th>CY</th><th>PY</th><th>Change %</th><th>Explanation</th></tr>
<tr><td>Revenue</td><td>$45.2M</td><td>$42.1M</td><td>7.4%</td><td>New product line</td></tr>
<tr><td>COGS</td><td>$27.1M</td><td>$25.3M</td><td>7.1%</td><td>Consistent with revenue</td></tr>
<tr><td>SG&A</td><td>$8.5M</td><td>$7.2M</td><td>18.1%</td><td>Investigated - see below</td></tr>
<tr><td>Interest</td><td>$1.2M</td><td>$0.9M</td><td>33.3%</td><td>New debt facility</td></tr>
</table>

<h3>Investigation - SG&A Increase</h3>
<p>The 18.1% increase in SG&A is primarily attributable to:</p>
<ul>
<li>New sales team expansion: $650K</li>
<li>Marketing campaign for new product: $400K</li>
<li>Software implementations: $250K</li>
</ul>

<h3>Conclusion</h3>
<p>All significant fluctuations have been satisfactorily explained.</p>`,
          summary: "Income statement analytics - fluctuations explained"
        }
      }
    ]
  },
  {
    type: "reconciliation",
    templates: [
      {
        title: "Bank Reconciliation Review",
        reference_suffix: "BANK",
        content: {
          html: `<h2>Bank Reconciliation Review</h2>
<h3>Objective</h3>
<p>To verify cash balances are properly reconciled and agree to general ledger.</p>

<h3>Accounts Tested</h3>
<table border="1" cellpadding="5">
<tr><th>Account</th><th>Bank Balance</th><th>Book Balance</th><th>Reconciling Items</th></tr>
<tr><td>Operating - Chase</td><td>$1,245,892</td><td>$1,198,456</td><td>$47,436 O/S checks</td></tr>
<tr><td>Payroll - Chase</td><td>$89,234</td><td>$89,234</td><td>None</td></tr>
<tr><td>Savings - BofA</td><td>$500,000</td><td>$500,000</td><td>None</td></tr>
</table>

<h3>Procedures Performed</h3>
<ul>
<li>Obtained bank confirmations - agreed to bank statements ✓</li>
<li>Tested reconciling items for clearance post year-end ✓</li>
<li>Verified no unusual reconciling items ✓</li>
<li>Traced to general ledger ✓</li>
</ul>

<h3>Conclusion</h3>
<p>Bank reconciliations are properly prepared and cash balances are fairly stated.</p>`,
          summary: "Bank reconciliations reviewed - no exceptions"
        }
      },
      {
        title: "Intercompany Reconciliation",
        reference_suffix: "IC",
        content: {
          html: `<h2>Intercompany Reconciliation</h2>
<h3>Objective</h3>
<p>To verify intercompany balances are properly reconciled and eliminated.</p>

<h3>Intercompany Balances</h3>
<table border="1" cellpadding="5">
<tr><th>Entity</th><th>Receivable</th><th>Payable</th><th>Difference</th></tr>
<tr><td>Parent Co</td><td>$2,500,000</td><td>-</td><td>-</td></tr>
<tr><td>Sub A</td><td>-</td><td>$1,500,000</td><td>-</td></tr>
<tr><td>Sub B</td><td>-</td><td>$1,000,000</td><td>-</td></tr>
<tr><td><strong>Total</strong></td><td>$2,500,000</td><td>$2,500,000</td><td>$0</td></tr>
</table>

<h3>Elimination Entry Tested</h3>
<p>DR Intercompany Payable $2,500,000</p>
<p>CR Intercompany Receivable $2,500,000</p>

<h3>Conclusion</h3>
<p>Intercompany balances properly reconcile and eliminate.</p>`,
          summary: "Intercompany balances reconciled - no differences"
        }
      }
    ]
  }
];

// Get all audits
async function getAudits() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/audits?select=id,audit_number,audit_title&limit=20`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  return response.json();
}

// Create workpaper
async function createWorkpaper(workpaper) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/audit_workpapers`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(workpaper)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create workpaper: ${error}`);
  }

  return response.json();
}

// Check existing workpapers
async function getExistingWorkpapers() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/audit_workpapers?select=audit_id,reference_number`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  return response.json();
}

async function main() {
  console.log('🚀 Seeding Workpapers for All Audits\n');

  const audits = await getAudits();
  console.log(`Found ${audits.length} audits\n`);

  const existingWorkpapers = await getExistingWorkpapers();
  const existingRefs = new Set(existingWorkpapers.map(wp => `${wp.audit_id}-${wp.reference_number}`));

  let created = 0;
  let skipped = 0;

  for (const audit of audits) {
    console.log(`\n📁 Processing: ${audit.audit_title}`);

    // Create 3-5 workpapers per audit from different types
    const workpapersToCreate = [];

    // Select templates from each type
    for (const typeGroup of workpaperTemplates) {
      // Take 1-2 templates from each type
      const numToTake = Math.min(typeGroup.templates.length, typeGroup.type === 'analysis' ? 2 : 1);
      for (let i = 0; i < numToTake; i++) {
        const template = typeGroup.templates[i];
        workpapersToCreate.push({
          ...template,
          type: typeGroup.type
        });
      }
    }

    let wpNumber = 1;
    for (const template of workpapersToCreate) {
      const refNumber = `WP-${template.reference_suffix}-${String(wpNumber).padStart(3, '0')}`;
      const uniqueKey = `${audit.id}-${refNumber}`;

      if (existingRefs.has(uniqueKey)) {
        console.log(`  ⏭️  Skipping ${refNumber} (already exists)`);
        skipped++;
        continue;
      }

      // Randomly assign statuses for variety
      const statuses = ['draft', 'draft', 'in_review', 'approved'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const workpaper = {
        audit_id: audit.id,
        firm_id: FIRM_ID,
        reference_number: refNumber,
        title: template.title,
        workpaper_type: template.type,
        content: template.content,
        status: status,
        prepared_by: DEMO_USER_ID,
        prepared_date: new Date().toISOString().split('T')[0],
        reviewed_by: status === 'approved' ? DEMO_USER_ID : null,
        reviewed_date: status === 'approved' ? new Date().toISOString().split('T')[0] : null
      };

      try {
        await createWorkpaper(workpaper);
        console.log(`  ✅ Created: ${refNumber} - ${template.title} (${status})`);
        created++;
        existingRefs.add(uniqueKey);
      } catch (error) {
        console.error(`  ❌ Failed: ${refNumber} - ${error.message}`);
      }

      wpNumber++;
    }
  }

  console.log(`\n\n✨ Done!`);
  console.log(`   Created: ${created} workpapers`);
  console.log(`   Skipped: ${skipped} (already existed)`);
}

main().catch(console.error);
