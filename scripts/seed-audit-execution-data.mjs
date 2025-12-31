import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';
const supabase = createClient(supabaseUrl, serviceKey);

const FIRM_ID = '00000000-0000-0000-0000-000000000001';

// User IDs from the firm
const USERS = {
  partner: 'e91826d7-e169-4d52-905e-55d486d98512',   // John Partner
  manager: '195e2ebf-1fc6-4c36-a18a-71c5e0056e2e',   // Sarah Manager
  staff: 'c03baf8f-c5ff-446b-8e28-401f9464abc7',     // Mike Staff
  demo: '950005d5-41d5-4f83-bf0b-efe32be1f055'       // Demo User
};

// Audit IDs
const AUDITS = {
  healthcare: '4f161f98-41ce-4682-bf7d-26afe0468e28',    // HealthCare Plus
  compliance: 'a52edabd-b721-46d5-b44f-195dffe115b7',    // Green Energy Q3
  itSecurity: '506082bf-b84a-471a-8537-ab2977406aac'     // Retail IT Security
};

async function seedWorkpapers() {
  console.log('Seeding audit_workpapers...');
  
  const workpapers = [
    // Healthcare Plus Audit Workpapers
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      reference_number: 'WP-100',
      title: 'Planning Memorandum',
      workpaper_type: 'planning',
      status: 'reviewed',
      prepared_by: USERS.manager,
      prepared_date: '2024-10-15',
      reviewed_by: USERS.partner,
      reviewed_date: '2024-10-18',
      content: {
        sections: [
          { title: 'Engagement Overview', content: 'Annual financial statement audit for HealthCare Plus for fiscal year ending December 31, 2024.' },
          { title: 'Key Audit Matters', content: 'Revenue recognition, Accounts receivable, Medical equipment depreciation' },
          { title: 'Materiality', content: 'Planning materiality: $500,000 (5% of pre-tax income). Trivial threshold: $25,000' },
        ]
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      reference_number: 'WP-110',
      title: 'Risk Assessment Matrix',
      workpaper_type: 'risk_assessment',
      status: 'reviewed',
      prepared_by: USERS.staff,
      prepared_date: '2024-10-20',
      reviewed_by: USERS.manager,
      reviewed_date: '2024-10-22',
      content: {
        risks: [
          { area: 'Revenue', inherent: 'High', control: 'Moderate', residual: 'Moderate' },
          { area: 'Accounts Receivable', inherent: 'High', control: 'Strong', residual: 'Low' },
          { area: 'Fixed Assets', inherent: 'Low', control: 'Strong', residual: 'Low' },
        ]
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      reference_number: 'WP-200',
      title: 'Cash and Bank Confirmations',
      workpaper_type: 'substantive',
      status: 'in_review',
      prepared_by: USERS.demo,
      prepared_date: '2024-11-10',
      content: {
        accounts: [
          { bank: 'First National Bank', account: 'Operating Account', confirmed_balance: 2450000, book_balance: 2450000, variance: 0 },
          { bank: 'First National Bank', account: 'Payroll Account', confirmed_balance: 185000, book_balance: 185000, variance: 0 },
        ],
        conclusion: 'All bank balances confirmed without exception'
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      reference_number: 'WP-300',
      title: 'Accounts Receivable Testing',
      workpaper_type: 'substantive',
      status: 'in_progress',
      prepared_by: USERS.staff,
      prepared_date: '2024-11-15',
      content: {
        sample_size: 25,
        tested: 18,
        exceptions: 2,
        exception_details: [
          { invoice: 'INV-2024-1234', issue: 'Cutoff - recorded in wrong period', amount: 15000 },
          { invoice: 'INV-2024-1567', issue: 'Classification error', amount: 8500 }
        ]
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      reference_number: 'WP-400',
      title: 'Revenue Cutoff Testing',
      workpaper_type: 'substantive',
      status: 'draft',
      prepared_by: USERS.demo,
      prepared_date: '2024-11-20',
      content: {
        period_tested: 'Dec 28 - Jan 5',
        transactions_tested: 30,
        cutoff_errors: 1,
        conclusion: 'One cutoff error identified - not material'
      }
    },

    // Green Energy Compliance Workpapers
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.compliance,
      reference_number: 'WP-100',
      title: 'Compliance Testing Program',
      workpaper_type: 'planning',
      status: 'reviewed',
      prepared_by: USERS.manager,
      prepared_date: '2024-09-05',
      reviewed_by: USERS.partner,
      reviewed_date: '2024-09-08',
      content: {
        compliance_areas: ['Environmental reporting', 'Safety protocols', 'Financial covenants', 'Regulatory filings'],
        methodology: 'Sample-based testing with 95% confidence level'
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.compliance,
      reference_number: 'WP-200',
      title: 'Environmental Compliance Testing',
      workpaper_type: 'compliance',
      status: 'in_progress',
      prepared_by: USERS.staff,
      prepared_date: '2024-09-20',
      content: {
        permits_reviewed: 12,
        exceptions: 0,
        reports_filed_timely: true
      }
    },

    // IT Security Assessment Workpapers
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.itSecurity,
      reference_number: 'WP-100',
      title: 'IT Security Assessment Scope',
      workpaper_type: 'planning',
      status: 'reviewed',
      prepared_by: USERS.manager,
      prepared_date: '2024-08-01',
      reviewed_by: USERS.partner,
      reviewed_date: '2024-08-05',
      content: {
        systems_in_scope: ['ERP System', 'Point of Sale', 'E-commerce Platform', 'Data Warehouse'],
        domains: ['Access Controls', 'Change Management', 'Data Protection', 'Incident Response']
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.itSecurity,
      reference_number: 'WP-200',
      title: 'Access Control Testing',
      workpaper_type: 'it_controls',
      status: 'in_review',
      prepared_by: USERS.demo,
      prepared_date: '2024-08-20',
      content: {
        users_sampled: 50,
        access_violations: 3,
        privileged_users_reviewed: 15,
        segregation_issues: 1,
        conclusion: 'Several access control deficiencies noted - see findings'
      }
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.itSecurity,
      reference_number: 'WP-300',
      title: 'Change Management Review',
      workpaper_type: 'it_controls',
      status: 'in_progress',
      prepared_by: USERS.staff,
      prepared_date: '2024-08-25',
      content: {
        changes_sampled: 20,
        unauthorized_changes: 0,
        documentation_gaps: 2
      }
    }
  ];

  const { data, error } = await supabase
    .from('audit_workpapers')
    .upsert(workpapers, { onConflict: 'reference_number,audit_id' })
    .select();

  if (error) {
    console.error('Error seeding workpapers:', error);
  } else {
    console.log(`✓ Seeded ${data.length} workpapers`);
  }
}

async function seedFindings() {
  console.log('Seeding audit_findings...');
  
  const findings = [
    // Healthcare Plus Findings
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      finding_number: 'F-2024-001',
      finding_title: 'Revenue Cutoff Errors',
      finding_type: 'internal_control',
      severity: 'medium',
      status: 'open',
      condition_description: 'During testing of revenue cutoff, we identified one transaction totaling $15,000 that was recorded in the incorrect period. The service was performed on January 2, 2025 but recorded in December 2024.',
      criteria: 'Revenue should be recognized when the performance obligation is satisfied per ASC 606.',
      cause: 'Month-end closing procedures do not include a comprehensive cutoff review.',
      effect: 'Revenue and accounts receivable may be misstated at period end.',
      recommendation: 'Implement a formal revenue cutoff checklist as part of month-end close procedures.',
      management_response: 'We agree with the finding and will implement a cutoff checklist effective Q1 2025.',
      identified_by: USERS.demo,
      identified_date: '2024-11-20',
      target_completion_date: '2025-03-31',
      risk_rating: 'moderate',
      financial_impact: 15000
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      finding_number: 'F-2024-002',
      finding_title: 'Accounts Receivable Classification Error',
      finding_type: 'misstatement',
      severity: 'low',
      status: 'in_progress',
      condition_description: 'Invoice INV-2024-1567 for $8,500 was incorrectly classified as current when it should be classified as long-term based on payment terms.',
      criteria: 'Receivables should be classified based on expected collection period per GAAP.',
      cause: 'Manual entry error during billing process.',
      effect: 'Current assets overstated by $8,500.',
      recommendation: 'Enhance billing system controls to auto-classify receivables based on payment terms.',
      management_response: 'Agreed. We have corrected this entry and will update our billing procedures.',
      identified_by: USERS.staff,
      identified_date: '2024-11-15',
      target_completion_date: '2025-01-31',
      actual_completion_date: null,
      risk_rating: 'low',
      financial_impact: 8500
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.healthcare,
      finding_number: 'F-2024-003',
      finding_title: 'Lack of Formal IT Change Management Policy',
      finding_type: 'control_deficiency',
      severity: 'high',
      status: 'open',
      condition_description: 'The organization lacks a formal documented IT change management policy. While changes appear to go through an informal approval process, there is no standardized documentation.',
      criteria: 'SOC 2 and industry best practices require formal change management policies and procedures.',
      cause: 'Rapid growth has outpaced policy development.',
      effect: 'Increased risk of unauthorized or untested changes affecting financial systems.',
      recommendation: 'Develop and implement a formal change management policy with documented approval workflows.',
      identified_by: USERS.manager,
      identified_date: '2024-10-25',
      target_completion_date: '2025-06-30',
      risk_rating: 'high',
      repeat_finding: false
    },

    // IT Security Assessment Findings
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.itSecurity,
      finding_number: 'F-2024-004',
      finding_title: 'Excessive Privileged Access',
      finding_type: 'control_deficiency',
      severity: 'critical',
      status: 'open',
      condition_description: 'Three users in the IT department have excessive system administrator privileges that are not required for their job functions. This includes the ability to modify audit logs.',
      criteria: 'Principle of least privilege - users should only have access required for their role.',
      cause: 'No formal access certification process exists.',
      effect: 'Risk of unauthorized system modifications and inability to rely on audit logs.',
      recommendation: 'Implement quarterly access certification reviews and remove unnecessary privileges immediately.',
      identified_by: USERS.demo,
      identified_date: '2024-08-20',
      target_completion_date: '2024-12-31',
      risk_rating: 'high',
      repeat_finding: false
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.itSecurity,
      finding_number: 'F-2024-005',
      finding_title: 'Segregation of Duties Conflict',
      finding_type: 'control_deficiency',
      severity: 'high',
      status: 'in_progress',
      condition_description: 'One user has the ability to both create vendors and process payments in the ERP system, representing a significant segregation of duties conflict.',
      criteria: 'Basic internal controls require segregation of incompatible duties.',
      cause: 'Role was granted during staff shortage without proper review.',
      effect: 'Increased risk of fraudulent vendor payments.',
      recommendation: 'Remove payment processing capability from this user and implement compensating detective controls.',
      management_response: 'Access has been partially restricted. Working on full remediation.',
      identified_by: USERS.demo,
      identified_date: '2024-08-20',
      target_completion_date: '2024-11-30',
      risk_rating: 'high'
    },
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.itSecurity,
      finding_number: 'F-2024-006',
      finding_title: 'Incomplete Change Documentation',
      finding_type: 'observation',
      severity: 'low',
      status: 'resolved',
      condition_description: 'Two of twenty sampled system changes lacked complete documentation of testing performed prior to deployment.',
      criteria: 'Change management best practices require documentation of testing.',
      cause: 'Informal process allows changes without mandatory documentation fields.',
      effect: 'Unable to verify that changes were properly tested before production deployment.',
      recommendation: 'Modify the change request form to require testing documentation.',
      management_response: 'We have updated the change request template to include mandatory testing fields.',
      identified_by: USERS.staff,
      identified_date: '2024-08-25',
      target_completion_date: '2024-10-31',
      actual_completion_date: '2024-10-15',
      risk_rating: 'low'
    },

    // Green Energy Compliance - Clean (no findings)
    {
      firm_id: FIRM_ID,
      audit_id: AUDITS.compliance,
      finding_number: 'F-2024-007',
      finding_title: 'Late Environmental Report Filing',
      finding_type: 'compliance',
      severity: 'medium',
      status: 'closed',
      condition_description: 'Q2 environmental emissions report was filed 3 days after the regulatory deadline.',
      criteria: 'EPA regulations require quarterly reports within 30 days of quarter end.',
      cause: 'Staff turnover during the quarter led to oversight.',
      effect: 'Potential regulatory fine of up to $5,000.',
      recommendation: 'Implement calendar reminders and backup responsibilities for regulatory filings.',
      management_response: 'Implemented automated reminders and cross-trained staff.',
      identified_by: USERS.staff,
      identified_date: '2024-09-25',
      target_completion_date: '2024-10-15',
      actual_completion_date: '2024-10-10',
      closed_by: USERS.manager,
      closed_date: '2024-10-12',
      risk_rating: 'moderate'
    }
  ];

  const { data, error } = await supabase
    .from('audit_findings')
    .upsert(findings, { onConflict: 'finding_number' })
    .select();

  if (error) {
    console.error('Error seeding findings:', error);
  } else {
    console.log(`✓ Seeded ${data.length} findings`);
  }
}

async function seedInformationRequests() {
  console.log('Seeding information_requests...');
  
  const requests = [
    // Healthcare Plus Requests
    {
      engagement_id: AUDITS.healthcare,
      request_title: 'Year-End Bank Statements',
      description: 'Please provide December 2024 bank statements for all company accounts including cleared check images.',
      items_requested: [
        'December 2024 bank statement - Operating Account',
        'December 2024 bank statement - Payroll Account',
        'Cleared check images for checks over $10,000',
        'Bank reconciliation as of December 31, 2024'
      ],
      requested_by: USERS.demo,
      assigned_to: null,
      due_date: '2025-01-15',
      status: 'sent',
      priority: 'high'
    },
    {
      engagement_id: AUDITS.healthcare,
      request_title: 'Accounts Receivable Aging Report',
      description: 'Please provide the detailed AR aging report as of December 31, 2024 with customer names and invoice details.',
      items_requested: [
        'AR aging report by customer',
        'AR aging summary by aging bucket',
        'List of receivables over 90 days with collection notes',
        'Bad debt write-off listing for 2024'
      ],
      requested_by: USERS.staff,
      assigned_to: null,
      due_date: '2025-01-10',
      status: 'completed',
      priority: 'high',
      client_response: 'All requested documents have been uploaded to the secure portal.',
      response_date: '2025-01-08'
    },
    {
      engagement_id: AUDITS.healthcare,
      request_title: 'Fixed Asset Additions Documentation',
      description: 'Please provide supporting documentation for fixed asset additions over $25,000 during FY2024.',
      items_requested: [
        'Fixed asset additions schedule',
        'Purchase invoices for additions over $25,000',
        'Capital expenditure approval forms',
        'Vendor quotes/bids for major purchases'
      ],
      requested_by: USERS.manager,
      assigned_to: null,
      due_date: '2025-01-20',
      status: 'in_progress',
      priority: 'medium'
    },
    {
      engagement_id: AUDITS.healthcare,
      request_title: 'Revenue Contracts Review',
      description: 'Please provide a listing of all significant revenue contracts entered into or modified during 2024.',
      items_requested: [
        'Schedule of new contracts > $100,000',
        'Contract amendments executed in 2024',
        'Copy of top 10 customer contracts by revenue',
        'Contract terms analysis prepared by management'
      ],
      requested_by: USERS.demo,
      assigned_to: null,
      due_date: '2025-01-25',
      status: 'draft',
      priority: 'medium'
    },

    // IT Security Assessment Requests
    {
      engagement_id: AUDITS.itSecurity,
      request_title: 'User Access Listing',
      description: 'Please provide current user access listings for all in-scope systems.',
      items_requested: [
        'ERP system user access report',
        'POS system user listing',
        'Domain admin account listing',
        'Service account inventory'
      ],
      requested_by: USERS.demo,
      assigned_to: null,
      due_date: '2024-08-15',
      status: 'completed',
      priority: 'urgent',
      client_response: 'Access reports extracted and uploaded.',
      response_date: '2024-08-14'
    },
    {
      engagement_id: AUDITS.itSecurity,
      request_title: 'Change Management Documentation',
      description: 'Please provide change management tickets and documentation for Q3 2024.',
      items_requested: [
        'Change request tickets for July-September 2024',
        'Change approval documentation',
        'Post-implementation review reports',
        'Emergency change log'
      ],
      requested_by: USERS.staff,
      assigned_to: null,
      due_date: '2024-08-20',
      status: 'completed',
      priority: 'high',
      client_response: 'All change management documentation provided.',
      response_date: '2024-08-19'
    },

    // Green Energy Compliance Requests
    {
      engagement_id: AUDITS.compliance,
      request_title: 'Environmental Permit Documentation',
      description: 'Please provide copies of all current environmental permits and recent inspection reports.',
      items_requested: [
        'Current EPA operating permits',
        'State environmental permits',
        'Inspection reports from last 12 months',
        'Permit renewal applications'
      ],
      requested_by: USERS.staff,
      assigned_to: null,
      due_date: '2024-09-15',
      status: 'completed',
      priority: 'high',
      client_response: 'All permits and inspection reports uploaded to the document portal.',
      response_date: '2024-09-12'
    },
    {
      engagement_id: AUDITS.compliance,
      request_title: 'Safety Training Records',
      description: 'Please provide employee safety training records for the compliance period.',
      items_requested: [
        'OSHA training completion records',
        'Safety certification documentation',
        'Training attendance logs',
        'Incident response drill reports'
      ],
      requested_by: USERS.manager,
      assigned_to: null,
      due_date: '2024-09-25',
      status: 'overdue',
      priority: 'medium'
    }
  ];

  const { data, error } = await supabase
    .from('information_requests')
    .insert(requests)
    .select();

  if (error) {
    console.error('Error seeding information requests:', error);
  } else {
    console.log(`✓ Seeded ${data.length} information requests`);
  }
}

async function seedAuditDocuments() {
  console.log('Seeding audit_documents (evidence)...');
  
  const documents = [
    // Healthcare Plus Evidence
    {
      audit_id: AUDITS.healthcare,
      document_name: 'Bank Statement - Operating Account Dec 2024.pdf',
      document_type: 'evidence',
      file_path: '/evidence/healthcare-plus/bank-statement-operating-dec24.pdf',
      file_size: 245678,
      tags: ['bank', 'cash', 'december'],
      uploaded_by: USERS.staff
    },
    {
      audit_id: AUDITS.healthcare,
      document_name: 'Bank Statement - Payroll Account Dec 2024.pdf',
      document_type: 'evidence',
      file_path: '/evidence/healthcare-plus/bank-statement-payroll-dec24.pdf',
      file_size: 156789,
      tags: ['bank', 'cash', 'payroll', 'december'],
      uploaded_by: USERS.staff
    },
    {
      audit_id: AUDITS.healthcare,
      document_name: 'AR Aging Report 12-31-2024.xlsx',
      document_type: 'client_provided',
      file_path: '/evidence/healthcare-plus/ar-aging-12312024.xlsx',
      file_size: 89234,
      tags: ['receivables', 'aging', 'year-end'],
      uploaded_by: USERS.demo
    },
    {
      audit_id: AUDITS.healthcare,
      document_name: 'Revenue Recognition Analysis.xlsx',
      document_type: 'workpaper',
      file_path: '/evidence/healthcare-plus/revenue-analysis.xlsx',
      file_size: 234567,
      tags: ['revenue', 'analysis', 'ASC 606'],
      uploaded_by: USERS.manager
    },
    {
      audit_id: AUDITS.healthcare,
      document_name: 'General Ledger Trial Balance.pdf',
      document_type: 'client_provided',
      file_path: '/evidence/healthcare-plus/gl-trial-balance.pdf',
      file_size: 567890,
      tags: ['general-ledger', 'trial-balance', 'year-end'],
      uploaded_by: USERS.staff
    },
    {
      audit_id: AUDITS.healthcare,
      document_name: 'External Legal Confirmation Response.pdf',
      document_type: 'correspondence',
      file_path: '/evidence/healthcare-plus/legal-confirmation.pdf',
      file_size: 123456,
      tags: ['confirmation', 'legal', 'litigation'],
      uploaded_by: USERS.manager
    },

    // IT Security Assessment Evidence
    {
      audit_id: AUDITS.itSecurity,
      document_name: 'User Access Report - ERP System.xlsx',
      document_type: 'evidence',
      file_path: '/evidence/retail-dynamics/user-access-erp.xlsx',
      file_size: 456789,
      tags: ['access', 'ERP', 'users', 'security'],
      uploaded_by: USERS.demo
    },
    {
      audit_id: AUDITS.itSecurity,
      document_name: 'Privileged Access Review Results.pdf',
      document_type: 'workpaper',
      file_path: '/evidence/retail-dynamics/privileged-access-review.pdf',
      file_size: 234567,
      tags: ['privileged', 'access', 'admin', 'review'],
      uploaded_by: USERS.demo
    },
    {
      audit_id: AUDITS.itSecurity,
      document_name: 'Change Management Tickets Q3 2024.pdf',
      document_type: 'evidence',
      file_path: '/evidence/retail-dynamics/change-tickets-q3.pdf',
      file_size: 789012,
      tags: ['change-management', 'tickets', 'Q3'],
      uploaded_by: USERS.staff
    },
    {
      audit_id: AUDITS.itSecurity,
      document_name: 'Network Architecture Diagram.pdf',
      document_type: 'support',
      file_path: '/evidence/retail-dynamics/network-diagram.pdf',
      file_size: 1234567,
      tags: ['network', 'architecture', 'infrastructure'],
      uploaded_by: USERS.manager
    },

    // Green Energy Compliance Evidence
    {
      audit_id: AUDITS.compliance,
      document_name: 'EPA Operating Permit 2024.pdf',
      document_type: 'evidence',
      file_path: '/evidence/green-energy/epa-permit-2024.pdf',
      file_size: 345678,
      tags: ['permit', 'EPA', 'environmental'],
      uploaded_by: USERS.staff
    },
    {
      audit_id: AUDITS.compliance,
      document_name: 'Quarterly Emissions Report Q3 2024.pdf',
      document_type: 'client_provided',
      file_path: '/evidence/green-energy/emissions-q3-2024.pdf',
      file_size: 234567,
      tags: ['emissions', 'environmental', 'quarterly'],
      uploaded_by: USERS.staff
    },
    {
      audit_id: AUDITS.compliance,
      document_name: 'Safety Inspection Report Aug 2024.pdf',
      document_type: 'evidence',
      file_path: '/evidence/green-energy/safety-inspection-aug24.pdf',
      file_size: 456789,
      tags: ['safety', 'inspection', 'OSHA'],
      uploaded_by: USERS.manager
    }
  ];

  const { data, error } = await supabase
    .from('audit_documents')
    .insert(documents)
    .select();

  if (error) {
    console.error('Error seeding audit documents:', error);
  } else {
    console.log(`✓ Seeded ${data.length} audit documents (evidence)`);
  }
}

async function main() {
  console.log('=== Seeding Audit Execution Module Data ===\n');
  
  await seedWorkpapers();
  await seedFindings();
  await seedInformationRequests();
  await seedAuditDocuments();
  
  console.log('\n=== Audit Execution Seeding Complete ===');
}

main().catch(console.error);
