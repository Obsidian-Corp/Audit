# UAT Fix Implementation Tickets

**Generated:** 2025-12-30
**Source Documents:** UAT_ISSUES_LOG.md, UAT_DATA_QUALITY_LOG.md, UAT_TEST_RESULTS.md, UAT_SUMMARY_REPORT.md
**Total UAT Issues:** 12 Issues + 5 Data Quality Issues + 1 Continuity Issue = 18 Total Findings

---

## Executive Summary

| Priority | Count | Estimated Hours | Description |
|----------|-------|-----------------|-------------|
| P0 Critical | 4 | 6-8 hrs | Data duplication cleanup, relationship fixes |
| P1 High | 4 | 8-10 hrs | Dashboard metrics, admin pages, branding |
| P2 Medium | 3 | 4-6 hrs | Demo data dates, auth flow, objectives |
| P3 Low | 2 | 2-3 hrs | Landing page, React Router warnings |
| **Total** | **13** | **20-27 hrs** | |

## Demo Readiness Milestones

- [ ] **P0 Complete** = Data is trustworthy (no duplicates, relationships work)
- [ ] **P1 Complete** = Dashboard accurate, admin functional, professional branding
- [ ] **P2 Complete** = Demo data realistic, polished experience
- [ ] **P3 Complete** = Excellence (post-demo polish)

---

# P0 - CRITICAL TICKETS (Demo Blockers)

---

## TICKET-001: Clean Up Duplicate Clients

**UAT Reference:** ISSUE-007
**Type:** Database Fix
**Priority:** P0 (Critical)
**Effort:** 2 hours
**Demo Blocker:** YES

### Problem Statement
89 clients displayed but only ~8 unique clients exist. Each client (e.g., "Acme Corporation") appears 11+ times with identical data except for primary key.

### Root Cause Analysis
Seed script ran multiple times without cleanup, OR lacks idempotent insert logic (no ON CONFLICT handling).

### Acceptance Criteria
- [ ] Only unique clients appear in client list (expect ~8 clients)
- [ ] Client codes are unique per firm
- [ ] Unique constraint added to prevent future duplicates
- [ ] Seed script updated to be idempotent

### Technical Approach
**Files to Modify:**
- `supabase/migrations/` - New migration for deduplication
- `scripts/seed-*.mjs` - Add ON CONFLICT handling

**Implementation Steps:**
1. Query to identify duplicate clients by client_code + firm_id
2. Create migration to delete duplicates (keep first record)
3. Add unique constraint on (client_code, firm_id)
4. Update seed scripts with ON CONFLICT DO NOTHING

**Database Changes:**
```sql
-- Step 1: Identify duplicates
WITH duplicates AS (
  SELECT id, client_code, firm_id,
    ROW_NUMBER() OVER (PARTITION BY client_code, firm_id ORDER BY created_at) as rn
  FROM clients
)
DELETE FROM clients WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint
ALTER TABLE clients ADD CONSTRAINT clients_code_firm_unique
  UNIQUE (client_code, firm_id);
```

### Testing Instructions
1. Run migration
2. Navigate to /clients
3. Verify each client appears only once
4. Attempt to create duplicate client - should fail gracefully
5. Re-run seed script - should not create duplicates

### Dependencies
- Depends on: None
- Blocks: TICKET-002, TICKET-005

---

## TICKET-002: Fix Client Engagement Count Display

**UAT Reference:** ISSUE-008
**Type:** Frontend Query Fix
**Priority:** P0 (Critical)
**Effort:** 1.5 hours
**Demo Blocker:** YES

### Problem Statement
All clients show "0 engagements" even though engagements exist and are linked to these clients (visible on dashboard).

### Root Cause Analysis
The client list query does not join/count engagements correctly. The engagement count is either:
1. Not queried at all (hardcoded 0)
2. Query uses wrong foreign key
3. RLS policy blocking the count query

### Acceptance Criteria
- [ ] "Acme Corporation" shows 1+ engagements
- [ ] "TechStart Industries" shows 1+ engagements
- [ ] "Financial Services Group" shows 1+ engagements
- [ ] Click on client shows their linked engagements

### Technical Approach
**Files to Modify:**
- `src/pages/Clients.tsx` or similar - Fix query
- `src/hooks/useClients.ts` - If separate data hook exists

**Implementation Steps:**
1. Find client list component/page
2. Examine query for engagement count
3. Fix join between clients and audits/engagements tables
4. Ensure RLS allows count aggregation

### Testing Instructions
1. Navigate to /clients
2. Verify engagement counts match actual data
3. Click client → verify engagements list

### Dependencies
- Depends on: TICKET-001 (deduplication)
- Blocks: None

---

## TICKET-003: Clean Up Duplicate Workpapers

**UAT Reference:** ISSUE-009
**Type:** Database Fix
**Priority:** P0 (Critical)
**Effort:** 1.5 hours
**Demo Blocker:** YES

### Problem Statement
"ITGC Testing Matrix" (WP-IT-001) appears 11 times in workpapers list. Same duplication pattern as clients.

### Root Cause Analysis
Same as TICKET-001 - seed script ran multiple times without idempotent handling.

### Acceptance Criteria
- [ ] Each workpaper appears once per audit
- [ ] Workpaper references are unique per audit
- [ ] Unique constraint prevents future duplicates

### Technical Approach
**Database Changes:**
```sql
-- Deduplicate workpapers
WITH duplicates AS (
  SELECT id, workpaper_reference, audit_id,
    ROW_NUMBER() OVER (PARTITION BY workpaper_reference, audit_id ORDER BY created_at) as rn
  FROM audit_workpapers
)
DELETE FROM audit_workpapers WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE audit_workpapers ADD CONSTRAINT workpapers_ref_audit_unique
  UNIQUE (workpaper_reference, audit_id);
```

### Testing Instructions
1. Run migration
2. Navigate to Workpapers → View Workpapers for any audit
3. Verify no duplicate workpapers
4. Re-run seed - no duplicates created

### Dependencies
- Depends on: None
- Blocks: None

---

## TICKET-004: Clean Up Duplicate Findings

**UAT Reference:** ISSUE-010
**Type:** Database Fix
**Priority:** P0 (Critical)
**Effort:** 1.5 hours
**Demo Blocker:** YES

### Problem Statement
"Revenue Recognition Timing" appears 8+ times, "AR Allowance Methodology" appears 9+ times in findings list.

### Root Cause Analysis
Same as other duplication issues - seed script idempotency.

### Acceptance Criteria
- [ ] Each unique finding appears once
- [ ] Finding numbers unique per engagement
- [ ] Unique constraint prevents future duplicates

### Technical Approach
**Database Changes:**
```sql
-- Deduplicate findings
WITH duplicates AS (
  SELECT id, finding_number, audit_id,
    ROW_NUMBER() OVER (PARTITION BY finding_number, audit_id ORDER BY created_at) as rn
  FROM audit_findings
)
DELETE FROM audit_findings WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE audit_findings ADD CONSTRAINT findings_number_audit_unique
  UNIQUE (finding_number, audit_id);
```

### Testing Instructions
1. Run migration
2. Navigate to Findings
3. Verify no duplicate findings
4. Count should match badge (26 becomes ~4-5 unique)

### Dependencies
- Depends on: None
- Blocks: None

---

# P1 - HIGH PRIORITY TICKETS

---

## TICKET-005: Fix Dashboard Metrics - My Tasks Count

**UAT Reference:** ISSUE-001, CONTINUITY-001, DATA-002, DATA-003
**Type:** Frontend Query Fix
**Priority:** P1 (High)
**Effort:** 2 hours
**Demo Blocker:** No (but severe trust damage)

### Problem Statement
Dashboard shows "My Tasks: 0" but navigation shows "My Procedures (44)". Dashboard shows "Total Active Engagements: 0" but 3 engagements are displayed below.

### Root Cause Analysis
Dashboard metric queries are:
1. Not connected to actual data sources
2. Using wrong user/firm filter
3. RLS blocking aggregation queries

### Acceptance Criteria
- [ ] My Tasks count matches My Procedures count (or explained difference)
- [ ] Total Active Engagements matches displayed engagement count
- [ ] Team Capacity reflects actual utilization (not 0%)
- [ ] All metrics are click-through to filtered list

### Technical Approach
**Files to Modify:**
- `src/pages/Dashboard.tsx` or `src/pages/Workspace.tsx`
- `src/components/dashboard/` - metric components
- `src/hooks/useDashboardMetrics.ts` - if exists

**Implementation Steps:**
1. Find dashboard metric queries
2. Trace "My Tasks" query - fix filter/source
3. Trace "Engagement Health" query - fix aggregation
4. Trace "Team Capacity" query - fix calculation
5. Add click handlers to navigate to filtered lists

### Testing Instructions
1. Login as Demo User
2. Verify My Tasks matches navigation badge
3. Verify Engagement Health total matches displayed engagements
4. Click each metric → navigates to relevant list

### Dependencies
- Depends on: TICKET-001 (for accurate counts after dedup)
- Blocks: None

---

## TICKET-006: Fix User Management Page

**UAT Reference:** ISSUE-011
**Type:** Bug Fix
**Priority:** P1 (High)
**Effort:** 2 hours
**Demo Blocker:** No (but admin function broken)

### Problem Statement
/admin/users page loads empty with 400 errors in console.

### Root Cause Analysis
Either:
1. API endpoint returning 400 (bad request)
2. Query missing required parameters
3. RLS blocking data access
4. Component not rendering data

### Acceptance Criteria
- [ ] User Management page loads without errors
- [ ] Shows list of users in firm
- [ ] Can view user details
- [ ] No console errors

### Technical Approach
**Files to Modify:**
- `src/pages/admin/Users.tsx` or similar
- Backend API if applicable
- RLS policies if blocking

**Implementation Steps:**
1. Open Network tab, identify failing request
2. Check API endpoint/query parameters
3. Verify RLS allows admin to view users
4. Fix query or component rendering

### Testing Instructions
1. Navigate to Administration → User Management
2. Verify page loads with user list
3. Check console for errors

### Dependencies
- Depends on: None
- Blocks: None

---

## TICKET-007: Implement Team Directory Route

**UAT Reference:** ISSUE-012
**Type:** Feature Implementation
**Priority:** P1 (High)
**Effort:** 2 hours
**Demo Blocker:** No (but dead link in nav)

### Problem Statement
/admin/team returns 404 - route not implemented but link exists in navigation.

### Root Cause Analysis
Route exists in navigation but page component was never created.

### Acceptance Criteria
- [ ] /admin/team route exists and loads
- [ ] Shows team members with roles
- [ ] No 404 error
- [ ] OR: Remove link from navigation if not needed

### Technical Approach
**Option A - Implement Page:**
- Create `src/pages/admin/TeamDirectory.tsx`
- Add route to router config
- Query profiles table for firm members

**Option B - Remove Link:**
- Remove "Team Directory" from navigation component
- Simpler if User Management covers this need

### Testing Instructions
1. Navigate to Administration → Team Directory
2. Verify page loads OR link removed

### Dependencies
- Depends on: None
- Blocks: None

---

## TICKET-008: Fix Branding - Replace "Skal" with "Obsidian Audit"

**UAT Reference:** ISSUE-002
**Type:** UX Fix
**Priority:** P1 (High)
**Effort:** 1.5 hours
**Demo Blocker:** No (but unprofessional)

### Problem Statement
Landing page shows "Skal - Enterprise Ontology Platform" but sidebar shows "Obsidian Audit Partners". Browser tab shows "Skal".

### Root Cause Analysis
App was built from a template called "Skal" and branding not fully updated.

### Acceptance Criteria
- [ ] Page title: "Obsidian Audit"
- [ ] Landing page: "Obsidian Audit Platform"
- [ ] Sidebar: "Obsidian Audit Partners" (already correct)
- [ ] No "Skal" references anywhere

### Technical Approach
**Files to Modify:**
- `index.html` - <title> tag
- `src/pages/Landing.tsx` or similar
- `vite.config.ts` or build config if title set there
- Search codebase for "Skal"

**Implementation Steps:**
1. `grep -r "Skal" src/` to find all references
2. Update page title in index.html
3. Update landing page content
4. Update any meta tags

### Testing Instructions
1. Navigate to landing page
2. Check browser tab title
3. Verify landing page says "Obsidian Audit"
4. Check sidebar consistency

### Dependencies
- Depends on: None
- Blocks: None

---

# P2 - MEDIUM PRIORITY TICKETS

---

## TICKET-009: Update Demo Data Dates to Realistic Values

**UAT Reference:** ISSUE-003, DATA-001
**Type:** Data Fix
**Priority:** P2 (Medium)
**Effort:** 1.5 hours
**Demo Blocker:** No (but embarrassing)

### Problem Statement
"FY2024 Internal Controls Testing" shows "496 days overdue" - nearly 1.5 years late.

### Root Cause Analysis
Engagement dates were seeded with fixed dates that are now far in the past.

### Acceptance Criteria
- [ ] No engagement more than 30 days overdue
- [ ] Mix of: 2-3 upcoming, 5-6 on-time, 2-3 slightly overdue
- [ ] Dates look realistic for a working audit firm

### Technical Approach
**Database Changes:**
```sql
-- Update engagement dates relative to current date
UPDATE audits SET
  planned_start_date = CURRENT_DATE - INTERVAL '30 days',
  planned_end_date = CURRENT_DATE + INTERVAL '14 days'
WHERE audit_title LIKE '%FY2024 Internal Controls%';

-- Update other engagements with varied dates
-- ... similar updates for each engagement
```

### Testing Instructions
1. View dashboard
2. Verify no "496 days overdue"
3. Verify realistic date spread

### Dependencies
- Depends on: None
- Blocks: None

---

## TICKET-010: Add Login Page UI

**UAT Reference:** ISSUE-004
**Type:** Feature Enhancement
**Priority:** P2 (Medium)
**Effort:** 2 hours
**Demo Blocker:** No (auto-login works for demo)

### Problem Statement
No visible authentication flow - auto-authenticates as Demo User without showing login form.

### Root Cause Analysis
Demo mode auto-login is intentional, but no login UI exists for production feel.

### Acceptance Criteria
- [ ] /login route exists with login form
- [ ] Form has email/password fields
- [ ] Demo mode: pre-fills demo credentials or has "Demo Login" button
- [ ] Looks professional for SOC 2 discussions

### Technical Approach
**Files to Create/Modify:**
- Create `src/pages/Login.tsx`
- Add route to router
- Style consistent with app theme

### Testing Instructions
1. Navigate to /login
2. Verify form displays
3. Login with demo credentials

### Dependencies
- Depends on: None
- Blocks: None

---

## TICKET-011: Add Engagement Objectives

**UAT Reference:** DATA-004
**Type:** Data Fix
**Priority:** P2 (Medium)
**Effort:** 1 hour
**Demo Blocker:** No (minor polish)

### Problem Statement
All audits show "No objective specified" in the description field.

### Root Cause Analysis
Seed data didn't populate the objective field.

### Acceptance Criteria
- [ ] Each audit has a meaningful objective
- [ ] Objectives match audit type (financial, compliance, IT, etc.)

### Technical Approach
**Database Changes:**
```sql
UPDATE audits SET objective = 'Audit of FY2024 financial statements in accordance with ISA'
WHERE audit_type = 'financial' AND objective IS NULL;

UPDATE audits SET objective = 'SOX 404 internal controls testing and evaluation'
WHERE audit_type = 'compliance' AND objective IS NULL;
-- etc.
```

### Testing Instructions
1. Navigate to Workpapers landing
2. Verify each audit card shows objective

### Dependencies
- Depends on: None
- Blocks: None

---

# P3 - LOW PRIORITY TICKETS (Post-Demo)

---

## TICKET-012: Create Audit-Specific Landing Page

**UAT Reference:** ISSUE-005
**Type:** UX Enhancement
**Priority:** P3 (Low)
**Effort:** 3 hours
**Demo Blocker:** No (demo skips landing)

### Problem Statement
Landing page shows generic "Enterprise Ontology Platform" with developer-focused messaging, not audit-specific value proposition.

### Acceptance Criteria
- [ ] Landing page speaks to auditors
- [ ] Highlights audit workflow features
- [ ] Professional appearance for CPA firms

### Technical Approach
Redesign landing page content with:
- Audit workflow visuals
- Feature highlights (workpapers, findings, compliance)
- Professional testimonials placeholder
- "Start Demo" CTA

### Dependencies
- Depends on: TICKET-008 (branding)
- Blocks: None

---

## TICKET-013: Fix React Router Future Flag Warnings

**UAT Reference:** ISSUE-006
**Type:** Technical Debt
**Priority:** P3 (Low)
**Effort:** 1 hour
**Demo Blocker:** No (console only)

### Problem Statement
Console shows React Router future flag warnings about state updates and relative route resolution.

### Acceptance Criteria
- [ ] No React Router warnings in console
- [ ] App works identically

### Technical Approach
**Files to Modify:**
- `src/main.tsx` or router configuration
- Add future flags to router config

```tsx
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});
```

### Dependencies
- Depends on: None
- Blocks: None

---

# EXECUTION ORDER

## Day 1: Critical Database Cleanup (P0)

| Order | Ticket | Title | Est. Time |
|-------|--------|-------|-----------|
| 1 | TICKET-001 | Clean Up Duplicate Clients | 2 hrs |
| 2 | TICKET-003 | Clean Up Duplicate Workpapers | 1.5 hrs |
| 3 | TICKET-004 | Clean Up Duplicate Findings | 1.5 hrs |
| 4 | TICKET-002 | Fix Client Engagement Count | 1.5 hrs |
| | | **Day 1 Total** | **6.5 hrs** |

**Checkpoint:** All data unique, relationships display correctly

## Day 2: Dashboard & Admin Fixes (P1)

| Order | Ticket | Title | Est. Time |
|-------|--------|-------|-----------|
| 5 | TICKET-005 | Fix Dashboard Metrics | 2 hrs |
| 6 | TICKET-006 | Fix User Management Page | 2 hrs |
| 7 | TICKET-007 | Implement/Remove Team Directory | 2 hrs |
| 8 | TICKET-008 | Fix Branding | 1.5 hrs |
| | | **Day 2 Total** | **7.5 hrs** |

**Checkpoint:** Dashboard accurate, admin works, branding consistent

## Day 3: Demo Polish (P2)

| Order | Ticket | Title | Est. Time |
|-------|--------|-------|-----------|
| 9 | TICKET-009 | Update Demo Data Dates | 1.5 hrs |
| 10 | TICKET-010 | Add Login Page UI | 2 hrs |
| 11 | TICKET-011 | Add Engagement Objectives | 1 hr |
| | | **Day 3 Total** | **4.5 hrs** |

**Checkpoint:** Demo data realistic, professional auth flow

## Post-Demo: Polish (P3)

| Order | Ticket | Title | Est. Time |
|-------|--------|-------|-----------|
| 12 | TICKET-012 | Audit-Specific Landing Page | 3 hrs |
| 13 | TICKET-013 | Fix React Router Warnings | 1 hr |
| | | **Post-Demo Total** | **4 hrs** |

---

# DEPENDENCY GRAPH

```
TICKET-001 (Dedupe Clients)
└── TICKET-002 (Client Engagement Count)
    └── TICKET-005 (Dashboard Metrics - depends on accurate data)

TICKET-003 (Dedupe Workpapers) - Independent
TICKET-004 (Dedupe Findings) - Independent

TICKET-006 (User Management) - Independent
TICKET-007 (Team Directory) - Independent

TICKET-008 (Branding)
└── TICKET-012 (Landing Page - should use correct branding)

TICKET-009 (Demo Dates) - Independent
TICKET-010 (Login Page) - Independent
TICKET-011 (Objectives) - Independent
TICKET-013 (React Router) - Independent
```

---

# UAT RETEST MAPPING

After fixes, retest these UAT items:

| Ticket | Resolves UAT Issue | Retest |
|--------|-------------------|--------|
| TICKET-001 | ISSUE-007 | Client list shows unique clients |
| TICKET-002 | ISSUE-008 | Clients show engagement counts |
| TICKET-003 | ISSUE-009 | Workpapers not duplicated |
| TICKET-004 | ISSUE-010 | Findings not duplicated |
| TICKET-005 | ISSUE-001, CONTINUITY-001 | Dashboard metrics reconcile |
| TICKET-006 | ISSUE-011 | User Management loads |
| TICKET-007 | ISSUE-012 | Team Directory works or removed |
| TICKET-008 | ISSUE-002 | Consistent "Obsidian Audit" branding |
| TICKET-009 | ISSUE-003, DATA-001 | Realistic dates |
| TICKET-010 | ISSUE-004 | Login form visible |
| TICKET-011 | DATA-004 | Engagement objectives populated |
| TICKET-012 | ISSUE-005 | Audit-specific landing |
| TICKET-013 | ISSUE-006 | No console warnings |

---

# SUCCESS CRITERIA

## Demo Ready State (After P0 + P1)
- [ ] No duplicate data anywhere
- [ ] All metrics reconcile
- [ ] No 404 or 500 errors
- [ ] Professional "Obsidian Audit" branding
- [ ] Admin pages functional

## Production Ready State (After P0 + P1 + P2)
- [ ] All above plus:
- [ ] Realistic demo data
- [ ] Login flow visible
- [ ] Engagement objectives populated

## Excellence State (After All Tickets)
- [ ] All above plus:
- [ ] Audit-focused landing page
- [ ] Zero console warnings
- [ ] Palantir-level data quality

---

**Document Status:** Ready for Execution
**Next Step:** Begin TICKET-001 (Clean Up Duplicate Clients)
