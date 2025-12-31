import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qtsvdeauuawfewdzbflr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0c3ZkZWF1dWF3ZmV3ZHpiZmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIxNzc2MiwiZXhwIjoyMDc5NzkzNzYyfQ.Rq_Oqb9rXDKdGthg6xuopXznsRD-NC_l0-okLUbaoic';
const supabase = createClient(supabaseUrl, serviceKey);

// Templates with comprehensive audit methodology data
const templates = {
  'Annual Financial Statement Audit': {
    description: 'Comprehensive financial statement audit engagement following ISA/GAAS standards. Includes risk assessment, substantive testing, and reporting phases for year-end financial statements.',
    default_scope: {
      objectives: [
        'Express an opinion on the fair presentation of financial statements in accordance with GAAP/IFRS',
        'Identify material misstatements whether due to fraud or error',
        'Evaluate internal controls relevant to the audit',
        'Comply with professional standards (ISA/GAAS)'
      ],
      areas_in_scope: [
        'Balance Sheet accounts',
        'Income Statement accounts',
        'Statement of Cash Flows',
        'Statement of Stockholders Equity',
        'Notes to Financial Statements',
        'Related Party Transactions',
        'Subsequent Events'
      ],
      areas_out_of_scope: [
        'Tax compliance review (separate engagement)',
        'IT penetration testing',
        'Operational efficiency review'
      ],
      materiality_basis: 'Pre-tax income or total revenue',
      materiality_percentage: '5% of pre-tax income or 0.5% of revenue'
    },
    default_milestones: [
      { name: 'Planning & Risk Assessment', days_offset: 0, deliverables: ['Engagement letter signed', 'Planning memo', 'Risk assessment documentation'] },
      { name: 'Interim Fieldwork', days_offset: 14, deliverables: ['Walkthrough documentation', 'Controls testing', 'Interim substantive procedures'] },
      { name: 'Year-End Fieldwork', days_offset: 45, deliverables: ['Substantive testing completed', 'Audit evidence gathered', 'Account reconciliations reviewed'] },
      { name: 'Review & Quality Control', days_offset: 70, deliverables: ['Manager review complete', 'Partner review complete', 'EQCR review (if applicable)'] },
      { name: 'Reporting & Completion', days_offset: 80, deliverables: ['Draft audit report', 'Management letter', 'Final signed report'] }
    ],
    default_team_structure: [
      { role: 'Engagement Partner', required_count: 1, skills: ['CPA', 'Industry expertise', 'Client relationship management'] },
      { role: 'Engagement Manager', required_count: 1, skills: ['CPA', 'Project management', 'Technical accounting'] },
      { role: 'Senior Associate', required_count: 2, skills: ['CPA eligible', 'Audit execution', 'Workpaper preparation'] },
      { role: 'Staff Associate', required_count: 2, skills: ['Analytical skills', 'Testing procedures', 'Documentation'] }
    ],
    estimated_hours_by_role: {
      'Engagement Partner': 40,
      'Engagement Manager': 120,
      'Senior Associate': 300,
      'Staff Associate': 240
    },
    deliverables_checklist: [
      'Signed engagement letter',
      'Planning memorandum',
      'Risk assessment documentation',
      'Materiality calculation',
      'Internal control documentation',
      'Test of controls workpapers',
      'Substantive testing workpapers',
      'Analytical procedures documentation',
      'Management representation letter',
      'Attorney inquiry letter responses',
      'Bank confirmation responses',
      'Accounts receivable confirmations',
      'Inventory observation memo',
      'Going concern evaluation',
      'Subsequent events review',
      'Summary of audit differences',
      'Draft financial statements',
      'Audit report',
      'Management letter (if applicable)',
      'Completion checklist'
    ]
  },

  'SOX 404 Compliance Audit': {
    description: 'Integrated audit of internal control over financial reporting (ICFR) for SEC registrants under Section 404 of the Sarbanes-Oxley Act.',
    default_scope: {
      objectives: [
        'Express an opinion on the effectiveness of internal control over financial reporting',
        'Identify and test key controls in significant accounts and processes',
        'Evaluate design and operating effectiveness of controls',
        'Report material weaknesses to the audit committee'
      ],
      areas_in_scope: [
        'Entity-level controls',
        'IT general controls',
        'Revenue recognition controls',
        'Procurement and accounts payable controls',
        'Payroll and HR controls',
        'Treasury and cash management controls',
        'Financial close and reporting controls',
        'Journal entry controls'
      ],
      areas_out_of_scope: [
        'Operational controls not related to financial reporting',
        'IT application controls for non-financial systems'
      ],
      control_framework: 'COSO 2013 Internal Control Framework',
      testing_approach: 'Top-down, risk-based approach per AS 2201'
    },
    default_milestones: [
      { name: 'Scoping & Planning', days_offset: 0, deliverables: ['Scoping matrix', 'Process narratives', 'Risk and control matrix (RCM)'] },
      { name: 'Walkthrough Testing', days_offset: 21, deliverables: ['Walkthrough documentation', 'Control identification', 'Key control determination'] },
      { name: 'Interim Controls Testing', days_offset: 42, deliverables: ['Controls test workpapers', 'Deficiency evaluation', 'Roll-forward strategy'] },
      { name: 'Year-End Controls Testing', days_offset: 75, deliverables: ['Roll-forward testing', 'Year-end controls testing', 'IT general controls testing'] },
      { name: 'Deficiency Evaluation & Reporting', days_offset: 90, deliverables: ['Deficiency classification memo', '404(b) opinion', 'Management letter'] }
    ],
    default_team_structure: [
      { role: 'Engagement Partner', required_count: 1, skills: ['CPA', 'SEC reporting expertise', 'PCAOB standards'] },
      { role: 'Engagement Manager', required_count: 1, skills: ['CPA', 'SOX methodology', 'IT audit coordination'] },
      { role: 'IT Audit Manager', required_count: 1, skills: ['CISA/CISSP', 'IT general controls', 'Application controls'] },
      { role: 'Senior Associate', required_count: 3, skills: ['SOX testing', 'Documentation', 'Control evaluation'] },
      { role: 'Staff Associate', required_count: 3, skills: ['Control testing', 'Sample selection', 'Workpaper preparation'] }
    ],
    estimated_hours_by_role: {
      'Engagement Partner': 60,
      'Engagement Manager': 200,
      'IT Audit Manager': 120,
      'Senior Associate': 600,
      'Staff Associate': 480
    },
    deliverables_checklist: [
      'Scoping documentation and significant accounts analysis',
      'Process flowcharts and narratives',
      'Risk and Control Matrix (RCM)',
      'Entity-level controls evaluation',
      'IT General Controls (ITGC) testing',
      'Walkthrough documentation for each significant process',
      'Test of design workpapers',
      'Test of operating effectiveness workpapers',
      'Sample selection documentation',
      'Control deficiency evaluation memo',
      'Material weakness/significant deficiency classification',
      'Management remediation plan review',
      'Integrated audit timeline coordination',
      'Audit Committee communications',
      'SOX 404(b) opinion on ICFR',
      'Management representation letter',
      'Completion memorandum'
    ]
  },

  'IT General Controls Review': {
    description: 'Assessment of IT General Controls (ITGCs) supporting financial reporting systems. Covers access security, change management, operations, and data center controls.',
    default_scope: {
      objectives: [
        'Evaluate ITGCs supporting financially significant applications',
        'Assess logical access controls and segregation of duties',
        'Test program change management procedures',
        'Evaluate computer operations and job scheduling',
        'Review disaster recovery and business continuity'
      ],
      areas_in_scope: [
        'Access to Programs and Data (logical security)',
        'Program Changes (change management)',
        'Computer Operations (job scheduling, batch processing)',
        'Program Development (SDLC for new systems)',
        'Physical and Environmental Security',
        'Disaster Recovery / Business Continuity'
      ],
      areas_out_of_scope: [
        'Application-level controls (covered in financial audit)',
        'Network penetration testing',
        'Cybersecurity maturity assessment'
      ],
      systems_in_scope: [
        'ERP System (SAP, Oracle, NetSuite)',
        'Financial Close System',
        'Treasury Management System',
        'Payroll System',
        'Operating System and Database'
      ]
    },
    default_milestones: [
      { name: 'Planning & Scoping', days_offset: 0, deliverables: ['System inventory', 'In-scope application list', 'ITGC test plan'] },
      { name: 'Access Controls Testing', days_offset: 10, deliverables: ['User access reviews', 'Privileged access testing', 'Segregation of duties analysis'] },
      { name: 'Change Management Testing', days_offset: 20, deliverables: ['Change management testing', 'Code migration controls', 'Emergency change procedures'] },
      { name: 'Operations & Recovery Testing', days_offset: 30, deliverables: ['Job scheduling review', 'Backup testing', 'DR plan review'] },
      { name: 'Reporting & Remediation', days_offset: 40, deliverables: ['ITGC findings report', 'Remediation recommendations', 'Management response'] }
    ],
    default_team_structure: [
      { role: 'IT Audit Partner', required_count: 1, skills: ['CISA', 'IT governance', 'Technical review'] },
      { role: 'IT Audit Manager', required_count: 1, skills: ['CISA/CISSP', 'ITGC methodology', 'System administration'] },
      { role: 'IT Senior Associate', required_count: 2, skills: ['IT audit', 'Security testing', 'Technical documentation'] },
      { role: 'IT Staff Associate', required_count: 1, skills: ['Data analysis', 'Testing support', 'Documentation'] }
    ],
    estimated_hours_by_role: {
      'IT Audit Partner': 20,
      'IT Audit Manager': 80,
      'IT Senior Associate': 160,
      'IT Staff Associate': 80
    },
    deliverables_checklist: [
      'System and application inventory',
      'ITGC scoping memorandum',
      'Logical access control testing workpapers',
      'Privileged access review documentation',
      'User access provisioning/de-provisioning testing',
      'Password configuration review',
      'Change management process testing',
      'Code migration control testing',
      'Emergency change procedure review',
      'Job scheduling and monitoring review',
      'Backup and recovery testing',
      'Disaster recovery plan review',
      'Physical security walkthrough',
      'ITGC deficiency summary',
      'IT control findings report',
      'Management action plan'
    ]
  },

  'Healthcare Compliance Audit': {
    description: 'Comprehensive compliance audit for healthcare organizations covering HIPAA, billing compliance, and regulatory requirements.',
    default_scope: {
      objectives: [
        'Assess compliance with HIPAA Privacy and Security Rules',
        'Evaluate healthcare billing and coding compliance',
        'Review Anti-Kickback Statute and Stark Law compliance',
        'Test policies and procedures for regulatory adherence',
        'Identify compliance program effectiveness'
      ],
      areas_in_scope: [
        'HIPAA Privacy Rule compliance',
        'HIPAA Security Rule compliance',
        'Medicare/Medicaid billing compliance',
        'Medical coding accuracy (CPT, ICD-10, HCPCS)',
        'Anti-Kickback Statute compliance',
        'Stark Law (physician self-referral)',
        'False Claims Act awareness',
        'Compliance program effectiveness'
      ],
      areas_out_of_scope: [
        'Clinical quality of care assessments',
        'Medical malpractice review',
        'State-specific licensing (unless specified)'
      ],
      regulations_covered: [
        'HIPAA (45 CFR Parts 160, 162, 164)',
        'Anti-Kickback Statute (42 U.S.C. § 1320a-7b)',
        'Stark Law (42 U.S.C. § 1395nn)',
        'False Claims Act (31 U.S.C. §§ 3729-3733)',
        'OIG Compliance Program Guidance'
      ]
    },
    default_milestones: [
      { name: 'Planning & Risk Assessment', days_offset: 0, deliverables: ['Compliance risk assessment', 'Audit plan', 'Document request list'] },
      { name: 'HIPAA Compliance Review', days_offset: 14, deliverables: ['Privacy Rule assessment', 'Security Rule assessment', 'Breach notification review'] },
      { name: 'Billing & Coding Review', days_offset: 28, deliverables: ['Claims sampling results', 'Coding accuracy analysis', 'Modifier usage review'] },
      { name: 'Regulatory Compliance Testing', days_offset: 42, deliverables: ['Anti-Kickback review', 'Stark Law assessment', 'Exclusion screening verification'] },
      { name: 'Reporting & Recommendations', days_offset: 56, deliverables: ['Compliance audit report', 'Corrective action plan', 'Board presentation'] }
    ],
    default_team_structure: [
      { role: 'Healthcare Partner', required_count: 1, skills: ['CHC', 'Healthcare regulatory', 'Compliance leadership'] },
      { role: 'Healthcare Manager', required_count: 1, skills: ['CHC/CHPC', 'HIPAA expertise', 'Billing compliance'] },
      { role: 'Compliance Senior', required_count: 2, skills: ['Healthcare compliance', 'Medical coding', 'Policy review'] },
      { role: 'Staff Associate', required_count: 2, skills: ['Documentation', 'Sampling', 'Testing procedures'] }
    ],
    estimated_hours_by_role: {
      'Healthcare Partner': 30,
      'Healthcare Manager': 100,
      'Compliance Senior': 200,
      'Staff Associate': 160
    },
    deliverables_checklist: [
      'Compliance program assessment',
      'HIPAA Privacy Rule checklist',
      'HIPAA Security Rule checklist',
      'Security risk assessment review',
      'Business Associate Agreement inventory',
      'Notice of Privacy Practices review',
      'Patient rights procedures review',
      'Claims sampling and testing workpapers',
      'Medical coding accuracy analysis',
      'Modifier usage review',
      'Physician arrangement review',
      'Anti-Kickback Statute compliance assessment',
      'Stark Law self-referral analysis',
      'Exclusion list screening documentation',
      'Training program effectiveness review',
      'Compliance hotline utilization review',
      'Corrective action plan tracking',
      'Healthcare compliance audit report',
      'Executive summary for Board'
    ]
  },

  'Tax Provision Review': {
    description: 'Review of income tax provision (ASC 740) for accuracy, completeness, and compliance with accounting standards.',
    default_scope: {
      objectives: [
        'Evaluate the accuracy of the income tax provision under ASC 740',
        'Review current and deferred tax calculations',
        'Assess uncertain tax positions (UTPs) under ASC 740-10',
        'Evaluate tax footnote disclosures',
        'Identify potential exposure items'
      ],
      areas_in_scope: [
        'Current income tax expense/benefit',
        'Deferred tax assets and liabilities',
        'Valuation allowance assessment',
        'Uncertain tax positions (FIN 48)',
        'Tax rate reconciliation',
        'Return-to-provision adjustments',
        'Tax footnote disclosures',
        'State and local income taxes',
        'International tax considerations'
      ],
      areas_out_of_scope: [
        'Tax return preparation',
        'Tax planning strategies',
        'Transfer pricing studies',
        'Indirect taxes (sales/use, VAT)'
      ],
      standards_applied: [
        'ASC 740 - Income Taxes',
        'ASC 740-10 - Uncertain Tax Positions',
        'SEC Regulation S-X',
        'GAAP disclosure requirements'
      ]
    },
    default_milestones: [
      { name: 'Planning & Data Gathering', days_offset: 0, deliverables: ['Document request list', 'Prior year provision review', 'Current year tax developments'] },
      { name: 'Current Tax Analysis', days_offset: 7, deliverables: ['Taxable income reconciliation', 'Current tax expense roll-forward', 'Rate reconciliation'] },
      { name: 'Deferred Tax Analysis', days_offset: 14, deliverables: ['Deferred tax roll-forward', 'Temporary difference analysis', 'Valuation allowance support'] },
      { name: 'UTP & Disclosure Review', days_offset: 21, deliverables: ['UTP analysis', 'Tax footnote review', 'Return-to-provision analysis'] },
      { name: 'Reporting & Close', days_offset: 28, deliverables: ['Tax provision memo', 'Management comments', 'Final workpapers'] }
    ],
    default_team_structure: [
      { role: 'Tax Partner', required_count: 1, skills: ['CPA', 'ASC 740 expertise', 'Technical tax review'] },
      { role: 'Tax Manager', required_count: 1, skills: ['CPA', 'Tax provision', 'GAAP/tax differences'] },
      { role: 'Tax Senior', required_count: 2, skills: ['Tax accounting', 'Deferred taxes', 'Tax software'] },
      { role: 'Tax Staff', required_count: 1, skills: ['Tax research', 'Workpaper preparation', 'Data analysis'] }
    ],
    estimated_hours_by_role: {
      'Tax Partner': 20,
      'Tax Manager': 60,
      'Tax Senior': 100,
      'Tax Staff': 40
    },
    deliverables_checklist: [
      'Tax provision planning memo',
      'Taxable income reconciliation',
      'Book-to-tax differences schedule',
      'Current tax expense calculation',
      'Deferred tax asset/liability roll-forward',
      'Temporary differences analysis',
      'Valuation allowance memorandum',
      'State apportionment analysis',
      'Effective tax rate reconciliation',
      'Return-to-provision analysis',
      'Uncertain tax position inventory',
      'UTP measurement documentation',
      'Interest and penalty calculations',
      'Tax footnote disclosure checklist',
      'Tax contingency analysis',
      'Management representation on tax matters',
      'Tax provision review summary memo'
    ]
  },

  'Due Diligence - M&A': {
    description: 'Financial and operational due diligence for mergers, acquisitions, and investment transactions.',
    default_scope: {
      objectives: [
        'Analyze historical and projected financial performance',
        'Identify quality of earnings adjustments',
        'Assess working capital requirements',
        'Evaluate contingent liabilities and risks',
        'Review IT systems and integration considerations',
        'Support transaction negotiations and purchase agreement'
      ],
      areas_in_scope: [
        'Quality of Earnings (QoE) analysis',
        'Working capital analysis',
        'Net debt calculations',
        'Revenue sustainability and customer concentration',
        'Cost structure and margin analysis',
        'Capital expenditure requirements',
        'Management and key employee assessment',
        'IT systems and technology stack',
        'Legal and contractual matters',
        'Tax structuring considerations'
      ],
      areas_out_of_scope: [
        'Legal due diligence (separate workstream)',
        'Environmental due diligence',
        'Technical product assessment',
        'Valuation (separate engagement)'
      ],
      financial_periods: 'Last 3 fiscal years + YTD current year + projections'
    },
    default_milestones: [
      { name: 'Kickoff & Data Room Access', days_offset: 0, deliverables: ['Due diligence checklist', 'Data room access', 'Management meeting agenda'] },
      { name: 'Financial Analysis', days_offset: 7, deliverables: ['QoE adjustments', 'Working capital analysis', 'Net debt schedule'] },
      { name: 'Operational Deep Dive', days_offset: 14, deliverables: ['Revenue analysis', 'Cost structure review', 'Customer concentration analysis'] },
      { name: 'Management Meetings', days_offset: 18, deliverables: ['Management presentation', 'Interview notes', 'Follow-up questions'] },
      { name: 'Report Drafting & Delivery', days_offset: 25, deliverables: ['Draft due diligence report', 'Executive summary', 'Final report delivery'] }
    ],
    default_team_structure: [
      { role: 'Transaction Partner', required_count: 1, skills: ['CPA/CFA', 'M&A experience', 'Deal advisory'] },
      { role: 'Transaction Manager', required_count: 1, skills: ['QoE methodology', 'Financial modeling', 'Report writing'] },
      { role: 'Senior Associate', required_count: 2, skills: ['Financial analysis', 'Data room review', 'Workpaper preparation'] },
      { role: 'Staff Associate', required_count: 2, skills: ['Data extraction', 'Analysis support', 'Documentation'] }
    ],
    estimated_hours_by_role: {
      'Transaction Partner': 40,
      'Transaction Manager': 120,
      'Senior Associate': 200,
      'Staff Associate': 160
    },
    deliverables_checklist: [
      'Due diligence request list',
      'Data room index and tracker',
      'Management presentation materials',
      'Quality of Earnings report',
      'EBITDA bridge and adjustments schedule',
      'Revenue sustainability analysis',
      'Customer concentration analysis',
      'Backlog and pipeline review',
      'Cost structure and margin analysis',
      'Working capital target analysis',
      'Net debt calculation',
      'CapEx analysis and requirements',
      'Related party transaction review',
      'Key contract summary',
      'Employee and benefits analysis',
      'IT systems assessment',
      'Tax due diligence summary',
      'Risk and opportunity matrix',
      'Executive summary presentation',
      'Buy-side due diligence report'
    ]
  }
};

async function updateTemplates() {
  console.log('Updating engagement templates with comprehensive audit data...\n');

  const { data: existingTemplates, error: fetchError } = await supabase
    .from('engagement_templates')
    .select('id, template_name');

  if (fetchError) {
    console.error('Error fetching templates:', fetchError);
    return;
  }

  for (const template of existingTemplates) {
    const updateData = templates[template.template_name];
    if (updateData) {
      const { error } = await supabase
        .from('engagement_templates')
        .update(updateData)
        .eq('id', template.id);

      if (error) {
        console.error(`Error updating ${template.template_name}:`, error);
      } else {
        console.log(`✓ Updated: ${template.template_name}`);
      }
    }
  }

  console.log('\nTemplate update complete!');
}

updateTemplates();
