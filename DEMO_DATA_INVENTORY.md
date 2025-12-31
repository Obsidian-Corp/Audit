# Obsidian Audit Platform - Demo Data Comprehensive Inventory

## Executive Summary

The Obsidian Audit Platform includes extensive seed/demo data across 9 seed scripts that create a complete, realistic demo audit environment. The demo tells the story of multiple concurrent audits at different phases with a diverse team performing complex audit procedures and identifying real-world control deficiencies.

---

## Demo Firms

### Primary Firm: Obsidian Consulting LLP
- **Firm ID**: `00000000-0000-0000-0000-000000000001`
- **Status**: Active
- **Purpose**: Main demo/test firm for all standard audit engagements

### Secondary Firms
- **Global Audit Services**: ID `00000000-0000-0000-0000-000000000002`
- **Regional Consulting**: ID `00000000-0000-0000-0000-000000000003`

---

## Demo Users (Team Members)

All demo users share the domain: `@obsidian-audit.com`

### Primary Demo User
- **Email**: `demo@obsidian-audit.com`
- **Password**: `demo123456`
- **Name**: Demo User
- **Title**: Senior Auditor
- **Role**: senior_auditor (has access to most features)
- **Purpose**: Main test user for demo walkthrough

### Team Members
| Name | Email | Title | Role | Purpose |
|------|-------|-------|------|---------|
| Sarah Manager | manager@obsidian-audit.com | Audit Manager | engagement_manager | Engagement oversight, approvals |
| John Partner | partner@obsidian-audit.com | Audit Partner | partner | Final authority, partner reviews |
| Mike Staff | staff@obsidian-audit.com | Staff Auditor | staff_auditor | Junior staff, procedure execution |
| Emily Chen | emily.chen@obsidian-audit.com | Senior Auditor | senior_auditor | Lead auditor on engagements |
| Marcus Johnson | marcus.johnson@obsidian-audit.com | Audit Manager | engagement_manager | Team management |
| Priya Patel | priya.patel@obsidian-audit.com | Staff Auditor | staff_auditor | Procedure implementation |
| James Wilson | james.wilson@obsidian-audit.com | Senior Associate | senior_auditor | Testing and analysis |
| Sofia Rodriguez | sofia.rodriguez@obsidian-audit.com | IT Audit Specialist | it_audit_specialist | ITGC and IT security tests |
| David Kim | david.kim@obsidian-audit.com | Audit Partner | partner | Partner review authority |
| Rachel Thompson | rachel.thompson@obsidian-audit.com | Risk Analyst | risk_analyst | Risk assessment |
| Andrew Martinez | andrew.martinez@obsidian-audit.com | Staff Auditor | staff_auditor | General procedures |
| Lisa Brown | lisa.brown@obsidian-audit.com | Audit Senior | senior_auditor | Workpaper review |
| Kevin Lee | kevin.lee@obsidian-audit.com | Internal Controls Specialist | controls_specialist | Control testing |
| Jennifer Davis | jennifer.davis@obsidian-audit.com | Audit Manager | engagement_manager | Engagement leadership |

**Total Demo Users**: 14 (1 primary + 13 additional team members)

---

## Demo Clients

### Overview
8 major clients across diverse industries representing different risk profiles, sizes, and regulatory requirements.

### Client Details

| Client Name | Code | Industry | Size | Risk Rating | Status | Revenue | Client Since | Notes |
|-------------|------|----------|------|-------------|--------|---------|--------------|-------|
| Acme Corporation | ACME-001 | Technology | Large | Medium | Active | $500M | 2020-01-15 | Publicly traded SaaS company |
| TechStart Industries | TECH-002 | Technology | Medium | Low | Active | $75M | 2022-06-01 | Fintech startup, IPO planned |
| HealthCare Plus | HCP-003 | Healthcare | Large | High | Active | $850M | 2019-03-20 | Hospital systems, HIPAA regulated |
| Green Energy Solutions | GES-004 | Energy | Medium | Medium | Active | $120M | 2021-09-15 | Renewable energy, gov contracts |
| Retail Dynamics Inc | RDI-005 | Retail | Large | Medium | Active | $2.1B | 2018-01-10 | National retail chain, 450 stores |
| Financial Services Group | FSG-006 | Financial Services | Large | High | Active | $3.5B | 2017-06-01 | Regional bank, SOX required |
| Manufacturing Partners LLC | MPL-007 | Manufacturing | Medium | Low | Active | $95M | 2023-02-15 | Industrial manufacturing |
| Real Estate Holdings Corp | REH-008 | Real Estate | Large | Medium | Active | $650M | 2020-11-01 | Commercial real estate, 125 properties |

**Total Clients**: 8
**Industries Represented**: 6 (Technology, Healthcare, Energy, Retail, Financial Services, Manufacturing, Real Estate)
**Risk Distribution**: 3 High, 4 Medium, 1 Low

---

## Demo Audits/Engagements

### Core Audits (Predefined)

| Audit ID | Audit Number | Client | Type | Status | Phase | Budget Hours | Hours Spent |
|----------|--------------|--------|------|--------|-------|--------------|-------------|
| 10000000-0000-0000-0000-000000000001 | AUD-2024-100 | Acme Corporation | Financial | Fieldwork | Fieldwork | 200+ | 65% utilized |
| 10000000-0000-0000-0000-000000000002 | AUD-2024-101 | TechStart Industries | Financial | Review | Review | 250+ | 40% utilized |
| 10000000-0000-0000-0000-000000000003 | HCP-003 | HealthCare Plus | Compliance | Fieldwork | Fieldwork | 180+ | 70% utilized |

### Additional Created Audits
Seed scripts create 15 more engagements across 2023, 2024, and 2025 with various statuses and phases:
- **2023 Audits**: 3 completed (financial, SOX, IT controls)
- **2024 Audits**: 5 in progress (various phases)
- **2025 Audits**: 4 in planning phase

**Total Engagements**: 18+

---

## Demo Audit Structure

### Audit Programs (Engagement-level procedures)

Created for each major audit with 3-5 programs per audit:

**Acme Corporation (AUD-2024-100) Programs:**
1. Revenue Recognition Testing (60% complete, substantive, in_progress)
2. Cash and Bank Confirmations (100% complete, substantive, completed)
3. Accounts Receivable (65% complete, substantive, in_progress)
4. Inventory Observation (0% complete, substantive, not_started)

**TechStart Industries (AUD-2024-101) Programs:**
1. IT General Controls (55% complete, control, in_progress)

**HealthCare Plus (HCP-003) Programs:**
1. HIPAA Compliance (70% complete, compliance, in_progress)

**Total Audit Programs**: 7+

---

## Demo Workpapers

### Sample Size
- **Acme Audit (AUD-2024-100)**: 6+ workpapers
  - WP-A-002: Accounts Receivable Lead Schedule (draft)
  - WP-A-003: Revenue Cutoff Testing (in_review)
  - WP-B-001: Bank Confirmation Summary (reviewed)
  - WP-C-001: Inventory Count Memo (draft)
  
- **TechStart Audit (AUD-2024-101)**: 1+ workpapers
  - WP-IT-001: ITGC Testing Matrix (in_review)
  
- **HealthCare Plus (HCP-003)**: 1+ workpapers
  - WP-H-001: HIPAA Risk Assessment (reviewed)

### Workpaper Types
- **Planning**: Audit planning memoranda, risk assessments
- **Testing**: Substantive testing, controls testing matrices
- **Analysis**: Revenue analysis, AR aging, inventory valuation
- **Confirmation**: Bank confirmations, AR confirmations
- **Reconciliation**: Bank reconciliations, intercompany reconciliations
- **Documentation**: Management rep letters, analytical reviews

### Status Distribution
- Draft: 30%
- In Review: 40%
- Reviewed/Approved: 30%

**Total Workpapers**: 90+

### Rich Content Examples
Workpapers include realistic HTML content with:
- Test objectives and procedures
- Results tables with data
- Findings and conclusions
- Supporting analyses
- Exception details

---

## Demo Findings

### Overview
Comprehensive findings representing real audit issues across financial, IT, and compliance domains.

### Finding Examples by Audit

**Acme Corporation (Financial Audit)**
- **F-2024-001**: Revenue Cutoff Errors (Medium severity, Open)
  - Issue: 3 transactions ($125K) recognized before delivery criteria met
  - Cause: Manual revenue process lacking automated delivery confirmation
  - Recommendation: Implement automated workflow linking revenue to proof of delivery
  - Status: Open
  
- **F-2024-002**: AR Allowance Methodology (Medium severity, Pending Response)
  - Issue: Allowance for doubtful accounts not updated quarterly
  - Financial Impact: Potential AR overstatement
  - Status: Pending management response

**TechStart Industries (IT/SOX Audit)**
- **F-2024-004**: User Access Review Not Performed (High severity, Open)
  - Issue: Quarterly user access reviews for ERP not performed in Q3
  - SOX Control: Violates quarterly access review requirement
  - Status: Open - remediation required

**HealthCare Plus (HIPAA Compliance)**
- **F-2024-005**: PHI Access Logging Gaps (High severity, Open)
  - Issue: Access logs for PHI not retained for required 6-year period
  - Regulatory Impact: HIPAA non-compliance
  - Root Cause: Log rotation policy set to 2 years instead of 6
  - Recommendation: Update policy and implement automated archival
  - Status: Open

### Finding Statistics
- **Total Findings**: 10+
- **Severity Breakdown**:
  - Critical: 1
  - High: 3
  - Medium: 4
  - Low: 2+
- **Status Breakdown**:
  - Open: 50%
  - Pending Response: 20%
  - In Progress: 20%
  - Resolved: 10%
- **Finding Types**:
  - Control Deficiencies: 60%
  - Misstatements: 20%
  - Observations: 20%

---

## Demo Confirmations

### Types of Confirmations
1. **Bank Account Confirmations** (2 examples)
   - First National Bank - Operating Account: $8.5M ✓ (resolved)
   - City Commercial Bank - Payroll Account: $2.15M ✓ (resolved)

2. **Accounts Receivable Confirmations** (3 examples)
   - ABC Corporation: $475K with timing difference exception (resolved)
   - XYZ Industries: $890K pending response (sent)
   - Global Enterprises: $675K with alternative procedures (resolved)

3. **Legal Confirmations** (1 example)
   - Smith & Associates LLP: Standard letter response (resolved)

### Confirmation Status Distribution
- **Resolved**: 4 (100% confirmed or alternative procedures completed)
- **Sent**: 1 (awaiting response, requires follow-up)
- **Alternative Procedures**: 1 (unable to obtain, performed vouching instead)

**Total Confirmations**: 6

### Exception Handling Examples
- Timing difference: Payment in transit ($25K)
- Alternative procedures: Subsequent receipts vouched for $500K
- All exceptions documented and resolved

---

## Materiality Calculations

Three materiality benchmarks for different audit types:

### Acme Corporation Financial Audit
- **Benchmark**: Total Revenue ($500M)
- **Overall Materiality**: $2.5M (0.5% of revenue)
- **Performance Materiality**: $1.875M (75% of overall)
- **Clearly Trivial**: $125K (5%)
- **Rationale**: Consistent with prior year, industry practice

### TechStart Industries (Growth-Stage)
- **Benchmark**: Total Assets ($75M)
- **Overall Materiality**: $750K (1.0% of assets)
- **Performance Materiality**: $562.5K
- **Risk Factors**: New client, high growth, IPO planned

### HealthCare Plus (Healthcare)
- **Benchmark**: Patient Revenue ($850M)
- **Overall Materiality**: $4.25M (0.5%)
- **Performance Materiality**: $3.1875M
- **Risk Factors**: HIPAA compliance, high regulatory scrutiny, complex revenue streams

---

## Time Entries

### Volume
- **Total Time Entries**: 60+
- **Sample Period**: 30 days of historical data
- **Weekday Distribution**: Excludes weekends

### Typical Activities
- Revenue testing and analysis
- Bank confirmation follow-up
- AR aging analysis and review
- Workpaper documentation
- Manager and partner review meetings
- Client inquiries (revenue contracts, controls)
- ITGC testing (access controls)
- Inventory observation planning
- Finding documentation
- Team coordination calls

### Billing Details
- **Billable Rate Range**: $175/hr - $350/hr
- **Duration Range**: 1.0 - 4.0 hours per entry
- **Status Distribution**: 70% approved, 30% draft
- **Daily Pattern**: 2-4 entries per day

---

## Projects & Workstreams

### Projects Created
1. **Acme Corp FY2024 Audit**
   - Status: In Progress (65% complete)
   - Budget: $150K | Spent: $85K
   - Duration: Oct 2024 - Feb 2025
   
2. **TechStart IPO Readiness**
   - Status: In Progress (40% complete)
   - Budget: $200K | Spent: $55K
   - Duration: Nov 2024 - Apr 2025
   
3. **HealthCare Plus HIPAA Audit**
   - Status: In Progress (70% complete)
   - Budget: $125K | Spent: $78K
   - Duration: Sep 2024 - Jan 2025
   
4. **Green Energy Tax Review**
   - Status: Completed (100%)
   - Budget: $45K | Spent: $42K
   - Duration: Aug 2024 - Nov 2024

### Workstreams (Project Phases)
Each project divided into logical workstreams:

**Acme Audit Workstreams:**
1. Planning Phase (Completed)
2. Fieldwork (Active)
3. Wrap-up & Reporting (On Hold)

**TechStart Audit Workstreams:**
1. IT Controls Assessment (Active)

---

## Tasks & Procedures

### Task Examples
- Complete revenue documentation (In Progress, High Priority)
- Follow up on AR confirmations (Pending, High Priority)
- Schedule inventory observation (Pending, Medium Priority)
- Prepare management letter points (Pending, Medium Priority)
- Review ITGC testing (Pending, Low Priority)

### Status Distribution
- **Pending/Not Started**: 50%
- **In Progress**: 30%
- **Completed**: 20%

### Engagement Procedures
- **Revenue Testing**: REV-001, REV-002 (testing & cutoff)
- **Cash Management**: CASH-001, CASH-002 (reconciliation testing)
- **AR & Collections**: AR-001, AR-002 (confirmations & aging)
- **Inventory**: INV-001 (observation procedures)
- **IT Controls**: IT-001, IT-002 (access controls, change management)
- **Security**: SEC-001, SEC-002 (HIPAA assessments, logging)

**Total Procedures**: 20+

---

## Information Requests

### Request Examples

**HealthCare Plus Audit:**
- Year-End Bank Statements (Sent, High Priority) - Due Jan 15
- Accounts Receivable Aging Report (Completed, High Priority) - Received Jan 8
- Fixed Asset Additions Documentation (In Progress, Medium) - Due Jan 20
- Revenue Contracts Review (Draft, Medium) - Due Jan 25

**IT Security Assessment:**
- User Access Listing (Completed, Urgent) - Received Aug 14
- Change Management Documentation (Completed, High) - Received Aug 19

**Green Energy Compliance:**
- Environmental Permit Documentation (Completed, High) - Received Sep 12
- Safety Training Records (Overdue, Medium) - Due Sep 25

**Status Distribution:**
- Pending: 40%
- In Progress: 20%
- Completed: 35%
- Overdue: 5%

**Total Requests**: 10+

---

## Engagement Activity Log

### Activity Types Tracked
- Status changes (Planning → In Progress, etc.)
- Workpaper creation
- Finding identification
- Review completion
- Document uploads
- Time entry logging
- Milestone achievements

### Sample Activity Timeline (30-day history)
- 3-6 activities per business day
- Random distribution across audit engagements
- Mix of system and manual activities

**Total Activity Entries**: 100+

---

## Risks & Risk Assessment

### Risk Examples

**Acme Corporation:**
- **Revenue Recognition Complexity** (High probability, High impact) - Identified
- **Related Party Transactions** (Medium probability, Critical impact) - Assessing
- **Inventory Obsolescence** (Medium probability, Medium impact) - Mitigating

**HealthCare Plus:**
- **HIPAA Data Breach** (Medium probability, Critical impact) - Monitoring

### Risk Metrics
- **Probability Levels**: Low, Medium, High
- **Impact Levels**: Low, Medium, High, Critical
- **Status Values**: Identified, Assessing, Mitigating, Monitoring, Closed

**Total Risks**: 4

---

## Demo Data Stories

### Story 1: Acme Corporation Financial Audit (65% Complete)
**Narrative**: Mid-year financial statement audit of established technology client.

- **Phase**: Fieldwork (since Nov 1)
- **Key Issues**: 
  - Revenue cutoff error identified ($15K, period timing issue)
  - AR classification error ($8.5K, minor)
  - Strong bank confirmations (no exceptions)
- **Status**: Revenue testing 60% complete, AR testing 65% complete, inventory observation not yet scheduled
- **Team**: Demo User (senior auditor), Sarah Manager (manager lead), Mike Staff (support)
- **Next Steps**: Inventory observation, complete remaining tests, draft management letter

### Story 2: TechStart IPO Readiness (40% Complete)
**Narrative**: First-time IPO preparation audit with SOX compliance focus.

**Phase**: Planning and early fieldwork
- **Key Risks**: Growth-stage company, new auditor relationship, complex revenue (IPO trajectory)
- **IT Controls**: Significant focus on system infrastructure and access controls
- **Finding**: IT access review incomplete in Q3 (requires remediation)
- **Budget**: 40% consumed (on track)
- **Timeline**: 5-month engagement (Nov 2024 - Apr 2025)

### Story 3: HealthCare Plus HIPAA Compliance (70% Complete)
**Narrative**: Complex healthcare provider with stringent regulatory requirements.

**Phase**: Deep fieldwork on HIPAA/security controls
- **Key Issues**: 
  - CRITICAL: PHI access logs not retained per HIPAA (6-year requirement)
  - HIGH: Potential breach risk from logging gaps
  - HIGH: Change management policy gaps
- **Focus Areas**: Access controls, encryption, incident response
- **Testing**: 25+ access violations noted, segregation issues detected
- **Regulatory Risk**: Non-compliance with HIPAA requirements
- **Status**: Major findings requiring management response

### Story 4: Green Energy Compliance (Completed, 100%)
**Narrative**: Successful compliance audit for renewable energy company.

**Phase**: Completed
- **Key Achievement**: Clean environmental compliance review
- **Minor Finding**: Late Q2 environmental report (3 days late) - RESOLVED
- **Permits**: All current and in good standing
- **Timeline**: Aug-Nov 2024 (on time, under budget)
- **Team**: Excellent execution, no significant issues

---

## Seed Script Execution Guide

### Scripts (in recommended execution order)

1. **seed-demo-data.mjs** (Primary - RUN FIRST)
   - Creates demo auth users
   - Creates demo profile
   - Seeds 8 clients
   - Creates 4 projects with workstreams
   - Seeds 8 tasks in various states
   - Seeds 4 risks
   - Seeds 60+ time entries
   - Seeds 6 audit programs
   - Seeds 6 workpapers
   - Seeds 4 additional findings
   - Seeds 6 confirmations
   - Seeds 3 materiality calculations
   - **Output**: ~4 team members, 8 clients, 4 projects, 60+ time entries

2. **seed-comprehensive-data.mjs**
   - Creates additional profiles (11 more team members)
   - Creates client contacts (50+ across 20 clients)
   - Creates 15 additional engagements
   - Creates engagement programs and procedures
   - **Output**: 15+ new engagements, 200+ procedures

3. **seed-engagements.mjs**
   - Creates 12 additional audit engagements with various statuses
   - **Output**: 12 more audits across 2023-2025

4. **seed-workpapers.mjs**
   - Creates comprehensive workpapers with rich HTML content
   - Creates 3-5 workpapers per audit
   - **Output**: 50+ detailed workpapers with realistic content

5. **seed-audit-execution-data.mjs** (Execution Module)
   - Seeds workpapers for 3 key audits
   - Seeds 6 findings with full details
   - Seeds 7 information requests
   - Seeds 12 audit documents/evidence files
   - **Output**: Detailed audit execution artifacts

6. **seed-workflow-demo-data.mjs**
   - Seeds 11 audit procedures with actual schema columns
   - Seeds 8 workpapers across audits
   - Seeds 4 additional findings
   - **Output**: Workflow-specific procedures and findings

7. **seed-navigation-demo-data.mjs** (Navigation Features)
   - Creates user roles for demo users
   - Seeds engagement procedures (for badges)
   - Seeds tasks for badge counts
   - Seeds findings (5 open)
   - Seeds information requests (4 pending)
   - Seeds confirmations (3 sent)
   - Seeds engagements pending approval
   - **Output**: Badge count data for navigation UI

8. **seed-audit-execution-final.mjs**
   - Final audit execution data
   - Polish and final details

### Login Credentials for Demo

```
Email:    demo@obsidian-audit.com
Password: demo123456
```

### Expected Database State After Full Seeding

| Entity | Count | Notes |
|--------|-------|-------|
| Firms | 3 | 1 primary, 2 secondary |
| Users (Auth) | 14+ | Demo + team members |
| Profiles | 14+ | One per auth user |
| Clients | 8 | Diverse industries |
| Audits/Engagements | 18+ | Mix of completed, active, planned |
| Clients Contacts | 50+ | 2-3 per major client |
| Audit Programs | 7+ | Per audit |
| Workpapers | 90+ | Multiple types and statuses |
| Findings | 10+ | Various severities and statuses |
| Confirmations | 6+ | Bank, AR, legal |
| Time Entries | 60+ | 30-day history |
| Projects | 4 | With workstreams |
| Tasks | 8+ | Various statuses |
| Risks | 4+ | Across audits |
| Information Requests | 10+ | In various states |
| Audit Documents | 12+ | Evidence files |
| Materiality Calculations | 3 | Per audit |
| Activity Log Entries | 100+ | Engagement activity |

---

## Demo Data Quality & Realism

### Design Principles
- **Realistic Scenarios**: Reflects actual audit engagement workflows
- **Diverse Complexity**: Clients from simple to highly regulated
- **Complete Lifecycle**: Audits at different phases (planning, fieldwork, completion)
- **Real-World Issues**: Findings reflect actual control deficiencies
- **Variation**: Multiple statuses, severities, and resolution paths
- **Cross-functional**: Involves multiple team roles and responsibilities

### Consistency Checks
- Firm IDs consistent across all entities
- User IDs valid and referenced correctly
- Engagement statuses align with phase progress
- Materiality benchmarks appropriate for client type
- Finding amounts material relative to baselines

---

## Key Demo Scenarios

### Scenario 1: Executive Dashboard View
- Overview of 18 active/past engagements
- 4 in-progress projects at 65%, 40%, 70%, 100% completion
- 10+ open findings requiring attention
- 4 pending information requests
- 3 confirmations awaiting response

### Scenario 2: Audit Execution (Fieldwork)
- Navigate Acme audit at 65% complete
- View 6 workpapers in draft/review/approved states
- Review 2 findings (1 open, 1 pending response)
- Check 2+ confirmations (resolved)
- See 60+ hours of team time logged
- Track 8 tasks across multiple workstreams

### Scenario 3: Finding Management
- Open finding: Revenue cutoff errors ($15K, needs remediation)
- Critical finding: PHI logging gaps (regulatory non-compliance)
- Resolved finding: Environmental report timing (completed)
- See complete audit trail of finding lifecycle

### Scenario 4: Team Collaboration
- View 14 team members with different roles
- See assignments across multiple audits
- Review time entries and approvals
- Track engagement activity (100+ entries)

### Scenario 5: Information Requests
- Send confirmation requests to banks/customers
- Track information requests status
- See completed vs. pending responses
- Alternative procedures for outstanding confirmations

---

## Tips for Demo Walkthrough

1. **Start with HealthCare Plus** - Most findings and regulatory complexity
2. **Review Acme Audit** - Best example of audit lifecycle
3. **Check Navigation Badges** - Shows system is tracking work
4. **Explore Time Entries** - Demonstrates billing/resource tracking
5. **Review Open Findings** - Shows finding lifecycle and remediation
6. **Check Workpapers** - Rich HTML content demonstrates documentation
7. **View Materiality** - Shows quantitative audit planning
8. **Explore Projects** - Shows broader project management capabilities

---

## Notes for Running Demo

- **Order**: Run `seed-demo-data.mjs` first, then others in sequence
- **Time**: Seeding creates ~30-50 seconds of data per script
- **Idempotency**: Scripts use upsert to prevent duplicates on re-runs
- **Scope**: Can run all scripts multiple times to refresh/extend data
- **Clean Start**: Use `nuke-database.mjs` to clear before full re-seed
- **Performance**: Large volume of data tests application scalability

---

## Data Dictionary

### Audit Status Values
- `planning` - Initial planning phase
- `fieldwork` - Active testing in progress
- `review` - Internal/external review phase
- `reporting` - Final reporting phase
- `in_progress` - General in-progress state
- `completed` - Engagement concluded

### Finding Status Values
- `open` - Identified, awaiting response
- `pending_response` - Management response expected
- `in_progress` - Being remediated
- `closed` - Resolved/completed
- `resolved` - Finding resolved

### Workpaper Status Values
- `draft` - Initial preparation
- `in_review` - Under manager/partner review
- `reviewed` - Review complete
- `approved` - Fully approved

### Finding Severity Values
- `critical` - Immediate remediation required
- `high` - Significant risk, prompt remediation needed
- `medium` - Standard control issue
- `low` - Minor observation

### Confirmation Status Values
- `sent` - Awaiting response
- `received` - Response obtained
- `resolved` - Confirmation complete/resolved
- `alternative_procedures` - Alternative procedures performed

---

## Support & Questions

For demo data issues:
1. Check seed script comments for schema details
2. Verify firm_id and user_id references are correct
3. Ensure auth users created before profile seeding
4. Check database logs for constraint violations
5. Review script output for "✓" vs "⚠" indicators

---

**Last Updated**: December 30, 2024
**Demo Data Version**: 2.0
**Total Data Volume**: ~500+ entities across 25+ tables
