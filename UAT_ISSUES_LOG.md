# UAT Issues Log - Obsidian Audit Platform

**Test Date:** 2025-12-30
**Platform Version:** Development Build

---

## Critical Issues

### ISSUE-007: Massive Client Data Duplication

**Severity:** CRITICAL
**Type:** Data Integrity
**Found in Test:** TEST-010
**Reproducible:** Always

#### Description
The Clients page shows massive data duplication - the same clients appear 11+ times each, creating chaos in the client list.

#### Steps to Reproduce
1. Navigate to Engagements → Clients
2. Observe the client list
3. Notice same client names repeated many times

#### Expected Behavior
Each client should appear exactly once with accurate engagement counts

#### Actual Behavior
- "89 Total Clients" displayed but only ~8 unique clients
- "Acme Corporation" (ACME-001) appears 11+ times
- "Financial Services Group" appears 11+ times
- "TechStart Industries" appears 11+ times
- Every duplicate shows "0 engagements"

#### Evidence
```
Client List shows:
- Acme Corporation (ACME-001) - 0 engagements [repeated 11x]
- Financial Services Group (FSG-001) - 0 engagements [repeated 11x]
- TechStart Industries (TSI-001) - 0 engagements [repeated 11x]
... and so on for all clients
```

#### Impact Assessment

**Audit Expert Perspective:**
- **CRITICAL**: This is a fundamental data integrity failure
- Client master data is foundational to ALL audit operations
- Duplicate clients would cause:
  - Engagement assignment confusion
  - Incorrect billing
  - Regulatory/compliance issues
  - Workpaper misattribution
- No CPA firm would trust this system

**UX Expert Perspective:**
- User frustration level: 10/10
- Trust damage: CATASTROPHIC - fundamental data cannot be trusted
- Pattern violation: Basic database integrity violated
- Palantir standard: Complete failure of data lineage

#### Suggested Fix
1. IMMEDIATE: Identify and remove duplicate client records
2. Add unique constraint on client_code per firm
3. Investigate seed script for duplication source
4. Add data validation on client creation
5. Consider client deduplication migration

#### Priority Justification
**CRITICAL** - This breaks the foundational assumption that data is trustworthy. No feature testing can proceed meaningfully until client data integrity is restored.

---

### ISSUE-008: Clients Show 0 Engagements Despite Active Engagements

**Severity:** CRITICAL
**Type:** Broken Data Relationship
**Found in Test:** TEST-010
**Reproducible:** Always

#### Description
All clients show "0 engagements" even though the dashboard displays 3 active engagements linked to these same clients.

#### Steps to Reproduce
1. View Dashboard - shows 3 active engagements with client names
2. Navigate to Clients page
3. Find those same clients
4. All show "0 engagements"

#### Expected Behavior
- "Acme Corporation" should show 1+ engagements (SOX Readiness shown on dashboard)
- "TechStart Industries" should show 1+ engagement (Data Privacy Review)
- "Financial Services Group" should show 1+ engagement (Internal Controls)

#### Actual Behavior
All clients show "0 engagements" - the foreign key relationship between engagements and clients is broken or not being queried correctly

#### Impact Assessment

**Audit Expert Perspective:**
- **CRITICAL**: Cannot navigate from client to their engagements
- Standard audit workflow: Client → Engagements → Workpapers
- This breaks the fundamental navigation pattern

**UX Expert Perspective:**
- User frustration level: 9/10
- Trust damage: Severe - "I can see the engagement exists but client shows 0?"
- Palantir standard: Complete failure of bidirectional data relationships

#### Suggested Fix
1. Verify client_id foreign key in engagements/audits table
2. Fix the client list query to properly join and count engagements
3. Ensure the count reflects actual linked engagements

#### Priority Justification
**CRITICAL** - Breaks core navigation pattern and data trust

---

## High Priority Issues

### ISSUE-001: Dashboard Metrics Don't Reconcile

**Severity:** High
**Type:** Data
**Found in Test:** TEST-002
**Reproducible:** Always

#### Description
Dashboard summary cards show inconsistent/non-reconciling numbers that undermine user trust.

#### Steps to Reproduce
1. Login to workspace
2. Observe dashboard summary cards
3. Observe Firm Overview section

#### Expected Behavior
- All metrics should be accurate and reconcilable
- My Tasks should match actual task count
- Engagement Health should match visible engagements

#### Actual Behavior
- My Tasks: 0, but My Procedures shows 44
- Engagement Health: 0 total active, but 3 engagements displayed
- Team Capacity: 0%, but engagements show 31-62% budget consumed

#### Impact Assessment

**Audit Expert Perspective:**
- Auditors rely on accurate metrics for workload management
- Incorrect metrics cause missed deadlines and resource misallocation
- This level of discrepancy would cause auditors to distrust the system

**UX Expert Perspective:**
- User frustration level: 8/10
- Trust damage: High - numbers that don't add up = system can't be trusted
- Pattern violation: Basic data integrity expectation violated

#### Suggested Fix
1. Ensure dashboard queries correctly aggregate data
2. Add data validation to ensure counts reconcile
3. Consider adding "last updated" timestamp to metrics

#### Priority Justification
High - core dashboard credibility is essential for user adoption

---

### ISSUE-002: Branding Inconsistency

**Severity:** High
**Type:** UX
**Found in Test:** TEST-001
**Reproducible:** Always

#### Description
Multiple brand names used interchangeably causing confusion.

#### Steps to Reproduce
1. Navigate to landing page - shows "Skal - Enterprise Ontology Platform"
2. Login - shows "Obsidian Audit Partners" in sidebar
3. URL shows localhost but title is "Skal"

#### Expected Behavior
Consistent "Obsidian Audit" branding throughout

#### Actual Behavior
- Landing page: "Skal - Enterprise Ontology Platform"
- Sidebar header: "Obsidian Audit Partners"
- Browser tab: "Skal - Enterprise Ontology Platform"

#### Impact Assessment

**Audit Expert Perspective:**
- Professional appearance is critical for client-facing software
- Brand confusion suggests immature/unfinished product

**UX Expert Perspective:**
- User frustration level: 5/10
- Creates "is this the right app?" confusion
- Undermines professional perception

#### Suggested Fix
1. Standardize on "Obsidian Audit" throughout
2. Update page titles, landing page, and all branding
3. Consider audit-specific landing page vs generic platform page

#### Priority Justification
High - first impression and professional appearance

---

## Medium Priority Issues

### ISSUE-003: Unrealistic Demo Data Dates

**Severity:** Medium
**Type:** Data
**Found in Test:** TEST-002
**Reproducible:** Always

#### Description
Engagement dates show unrealistic "overdue" periods (496 days) that look unprofessional in demos.

#### Steps to Reproduce
1. View workspace dashboard
2. Observe "FY2024 Internal Controls Testing - Financial Services Group"
3. Note "496 days overdue"

#### Expected Behavior
Demo data should show realistic, current dates (some overdue by days/weeks, some upcoming)

#### Actual Behavior
Engagement shows 496 days overdue - nearly 1.5 years late

#### Impact Assessment

**Audit Expert Perspective:**
- No real engagement would be 496 days overdue without escalation
- Makes demo data look fake/untested

**UX Expert Perspective:**
- Demo impression: Poor
- Suggests data seeding was done once and never updated

#### Suggested Fix
1. Update demo data with relative dates (e.g., "current date - 7 days")
2. Or implement dynamic date calculation in seed scripts
3. Mix of: upcoming (2), on-time (5), slightly overdue (3)

#### Priority Justification
Medium - impacts demo credibility but doesn't block functionality

---

### ISSUE-004: No Visible Authentication Flow

**Severity:** Medium
**Type:** Missing Feature
**Found in Test:** TEST-001
**Reproducible:** Always

#### Description
No login form visible - system auto-authenticates as Demo User.

#### Steps to Reproduce
1. Navigate to landing page
2. Click "Start Building"
3. Immediately logged in as Demo User

#### Expected Behavior
Login form with email/password fields for authentication

#### Actual Behavior
Auto-authentication with no visible login process

#### Impact Assessment

**Audit Expert Perspective:**
- Audit software requires proper authentication for SOC 2
- No visible login = security concern for clients

**UX Expert Perspective:**
- Good for quick demos
- Bad for understanding production authentication flow

#### Suggested Fix
1. Add /login route with proper authentication form
2. Demo mode can bypass with demo credentials
3. Show login form even in demo for realism

#### Priority Justification
Medium - demo mode acceptable but production needs proper auth

---

## Low Priority Issues

### ISSUE-005: Generic Landing Page

**Severity:** Low
**Type:** UX
**Found in Test:** TEST-001
**Reproducible:** Always

#### Description
Landing page shows generic "Enterprise Ontology Platform" content, not audit-specific value proposition.

#### Steps to Reproduce
1. Navigate to http://localhost:8080/
2. Observe landing page content

#### Expected Behavior
Audit-focused landing page highlighting:
- Audit workflow automation
- Compliance features
- Team collaboration
- Integration with accounting systems

#### Actual Behavior
Generic tech platform content:
- "Data Intelligence Layer"
- "Ontology processing"
- Developer-focused features

#### Impact Assessment

**Audit Expert Perspective:**
- CPA firms won't relate to "ontology" messaging
- Missing audit-specific value props

**UX Expert Perspective:**
- User frustration level: 3/10
- Wrong audience messaging
- Doesn't build audit credibility

#### Suggested Fix
Create audit-specific landing page with:
- Audit workflow visuals
- Compliance/standards badges
- CPA firm testimonials
- Feature highlights relevant to auditors

#### Priority Justification
Low - demo skips this page, but needed for marketing

---

### ISSUE-006: React Router Warnings

**Severity:** Low
**Type:** Bug
**Found in Test:** TEST-001
**Reproducible:** Always

#### Description
Console shows React Router future flag warnings.

#### Console Output
```
React Router Future Flag Warning: React Router will begin wrapping state updates in `Re...
React Router Future Flag Warning: Relative route resolution within Splat routes is chan...
```

#### Impact Assessment
- No user-visible impact
- Technical debt indicator

#### Suggested Fix
Update React Router configuration for future compatibility

#### Priority Justification
Low - no user impact, technical cleanup

---

## Issues by Category

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Data Integrity | 4 | 4 | 0 | 0 | 0 |
| Bug | 3 | 0 | 2 | 0 | 1 |
| UX | 2 | 0 | 1 | 0 | 1 |
| Data | 2 | 0 | 1 | 1 | 0 |
| Missing Feature | 1 | 0 | 0 | 1 | 0 |
| **Total** | 12 | 4 | 4 | 2 | 2 |

---

## Critical Issues Summary

| ID | Issue | Impact |
|----|-------|--------|
| ISSUE-007 | Massive Client Data Duplication | Data integrity failure - clients duplicated 11x |
| ISSUE-008 | Clients Show 0 Engagements | Broken data relationships - navigation broken |
| ISSUE-009 | Workpaper Data Duplication | Workpapers duplicated multiple times |
| ISSUE-010 | Findings Data Duplication | Findings duplicated multiple times |

## High Priority Issues Summary

| ID | Issue | Impact |
|----|-------|--------|
| ISSUE-001 | Dashboard Metrics Don't Reconcile | Trust damage - numbers don't add up |
| ISSUE-002 | Branding Inconsistency | Professional appearance issue |
| ISSUE-011 | User Management Page Empty | Admin functionality broken |
| ISSUE-012 | Team Directory 404 | Dead link in navigation |

**Recommendation:** Testing should pause until critical data issues are resolved. The systemic data duplication affects Clients, Workpapers, and Findings - likely a seed script or database issue running multiple times.

---

### ISSUE-009: Workpaper Data Duplication

**Severity:** CRITICAL
**Type:** Data Integrity
**Found in Test:** TEST-020
**Reproducible:** Always

#### Description
The Workpapers list shows massive data duplication - the same workpapers appear multiple times.

#### Steps to Reproduce
1. Navigate to Audit Execution → Workpapers
2. Click "View Workpapers" for Q3 2024 SOX Compliance Review
3. Observe the workpapers list

#### Expected Behavior
Each workpaper should appear exactly once

#### Actual Behavior
- "ITGC Testing Matrix" (WP-IT-001) appears 11 times
- "ITGC Testing Matrix" (WP-IT-100) appears 3 times
- Same issue as client duplication

#### Impact Assessment

**Audit Expert Perspective:**
- **CRITICAL**: Workpapers are the core deliverable of an audit
- Duplicate workpapers would cause:
  - Confusion about which version is authoritative
  - Review workflow chaos
  - Regulatory compliance issues
  - Evidence integrity concerns

**UX Expert Perspective:**
- User frustration level: 10/10
- Trust damage: CATASTROPHIC
- Palantir standard: Complete failure of data uniqueness

#### Priority Justification
**CRITICAL** - Same root cause as client duplication. Systemic data integrity failure.

---

### ISSUE-010: Findings Data Duplication

**Severity:** CRITICAL
**Type:** Data Integrity
**Found in Test:** TEST-040
**Reproducible:** Always

#### Description
The Findings register shows duplicated findings - same finding title appears multiple times with different IDs.

#### Steps to Reproduce
1. Navigate to Audit Execution → Findings
2. Observe the findings table

#### Expected Behavior
Each unique finding should appear once

#### Actual Behavior
- "Revenue Recognition Timing" appears 8+ times with different IDs
- "AR Allowance Methodology" appears 9+ times
- "User Access Review Not Performed" appears 9+ times
- Same systemic duplication as clients and workpapers

#### Impact Assessment

**Audit Expert Perspective:**
- **CRITICAL**: Findings are regulatory deliverables
- Duplicate findings would invalidate management letters
- Could cause regulatory non-compliance
- Makes it impossible to track remediation accurately

#### Priority Justification
**CRITICAL** - Same root cause. This is now confirmed as a SYSTEMIC data duplication issue affecting ALL major entities: Clients, Workpapers, and Findings.

---

### ISSUE-011: User Management Page Empty/Broken

**Severity:** High
**Type:** Bug
**Found in Test:** TEST-070
**Reproducible:** Always

#### Description
The User Management page (/admin/users) loads with an empty content area and generates 400 errors in the console.

#### Steps to Reproduce
1. Navigate to Administration → User Management
2. Observe empty page and console errors

#### Expected Behavior
User list with ability to manage users, roles, and permissions

#### Actual Behavior
- Empty main content area
- Console shows: "Failed to load resource: the server responded with a status of 400"

#### Impact Assessment

**Audit Expert Perspective:**
- User management is essential for SOC 2 compliance
- Cannot manage team access without this page

**UX Expert Perspective:**
- User frustration level: 8/10
- Admin functions are critical for firm setup

#### Priority Justification
**High** - Admin functionality required for firm operations

---

### ISSUE-012: Team Directory Page Returns 404

**Severity:** High
**Type:** Bug
**Found in Test:** TEST-071
**Reproducible:** Always

#### Description
The Team Directory page (/admin/team) returns a 404 error - the route is not implemented.

#### Steps to Reproduce
1. Navigate to Administration → Team Directory
2. Observe 404 error page

#### Expected Behavior
Team directory with list of firm members

#### Actual Behavior
- 404 error page: "Oops! Page not found"
- Console shows: "User attempted to access non-existent route: /admin/team"

#### Impact Assessment

**Audit Expert Perspective:**
- Team visibility is essential for engagement assignment
- Cannot see who's on the team

**UX Expert Perspective:**
- User frustration level: 7/10
- Dead link in navigation is a basic quality issue

#### Priority Justification
**High** - Navigation contains link to non-existent page

