# UAT Data Quality Log - Obsidian Audit Platform

**Test Date:** 2025-12-30
**Platform Version:** Development Build

---

## Data Continuity Violations

### CONTINUITY-001: Dashboard Metrics vs Actual Data Mismatch

**Type:** Broken Lineage
**Severity:** High

#### The Break
**From:** Dashboard Summary Cards
**Expected Path:** Click on metric → See matching list of items
**Actual:** Numbers don't match underlying data

#### Specific Discrepancies
| Metric | Dashboard Shows | Expected Source | Actual Count |
|--------|----------------|-----------------|--------------|
| My Tasks | 0 | /tasks or /my-procedures | 44 procedures shown in nav |
| My Audits | 3 | Engagement list | 3 (matches) |
| Total Active (Firm) | 0 | All active engagements | 3 shown on dashboard |
| Team Capacity | 0% | Team utilization calc | Should reflect 31-62% shown |

#### Palantir Standard Violation
- [x] Data has no traceable source
- [ ] Data has no visible destination
- [ ] Relationship is not bidirectional
- [ ] Context is lost during navigation
- [x] Lineage is unclear or undocumented

#### User Impact
**Analyst Question That Fails:**
"How many tasks do I have pending?" - Dashboard says 0, but nav says 44 procedures

**Trust Damage:** 9/10
**Workflow Blocked:** No, but trust severely impacted

#### Required Fix
- Audit all dashboard aggregation queries
- Ensure "My Tasks" accurately reflects user's pending work
- Ensure "Engagement Health" counts match displayed engagements
- Add click-through from metrics to filtered lists

---

## Missing Data Issues

### DATA-001: Engagement "496 Days Overdue"

**Category:** Unrealistic Data
**Location:** Workspace Dashboard > My Active Engagements
**Severity:** Medium

#### What's Wrong
FY2024 Internal Controls Testing shows "496 days overdue" - nearly 1.5 years

#### Evidence
- What you see: "Due: 496 days overdue"
- What you expected: Realistic overdue period (e.g., 2-4 weeks max for demo)

#### Why This Matters

**Real User Reaction:**
"This looks like test data that was never cleaned up. Is this a real product?"

**Trust Impact:** 6/10
**Demo Impact:**
- [x] Would be visible in demo
- [x] Would raise questions
- [x] Would embarrass us

#### The Fix
Update engagement planned_end_date to be within realistic range:
- Some 1-2 weeks overdue
- Some on-time
- Some upcoming

---

### DATA-002: Engagement Health All Zeros

**Category:** Missing Data
**Location:** Workspace Dashboard > Firm Overview > Engagement Health
**Severity:** High

#### What's Wrong
Engagement Health shows:
- At Risk: 0
- On Track: 0
- Ahead: 0
- Total Active: 0

But 3 active engagements are displayed directly above.

#### Evidence
- What you see: 0 total active engagements
- What you expected: 3 (matching the displayed engagements)

#### Why This Matters

**Real User Reaction:**
"The system says we have no active engagements but I'm looking at three right here?"

**Trust Impact:** 9/10
**Demo Impact:**
- [x] Would be visible in demo
- [x] Would raise questions
- [x] Would embarrass us

#### The Fix
Ensure Engagement Health query correctly counts:
- Active engagements assigned to user's firm
- Health status calculation (at risk/on track/ahead based on dates and completion)

---

### DATA-003: Team Capacity 0% Despite Active Work

**Category:** Inconsistent Data
**Location:** Workspace Dashboard > Firm Overview > Team Capacity
**Severity:** High

#### What's Wrong
Team Capacity shows:
- Overall Utilization: 0%
- Available this week: 0
- Overallocated: 0

But engagements show 31-62% budget consumption, indicating active work.

#### Evidence
- What you see: 0% utilization
- What you expected: Non-zero utilization reflecting active engagements

#### Why This Matters

**Real User Reaction:**
"How can we have 0% utilization when these engagements are 31-62% complete?"

**Trust Impact:** 8/10
**Demo Impact:**
- [x] Would be visible in demo
- [x] Would raise questions
- [x] Would embarrass us

#### The Fix
- Ensure time entries are seeded for demo users
- Calculate utilization from actual time entries
- Or calculate from engagement budget progress

---

### DATA-004: Engagement Objectives Missing

**Category:** Missing Data
**Location:** Workpapers Landing Page > Each Audit Card
**Severity:** Low

#### What's Wrong
All audits show "No objective specified" in the description field.

#### Evidence
- What you see: "No objective specified" for every audit
- What you expected: Meaningful audit objectives like "Annual audit of financial statements in accordance with ISA"

#### Why This Matters

**Real User Reaction:**
"Every engagement has no objective? That's not realistic."

**Trust Impact:** 4/10
**Demo Impact:**
- [x] Would be visible in demo
- [ ] Would raise questions
- [ ] Would embarrass us

#### The Fix
Add realistic objectives to each audit engagement:
- "Audit of FY2024 financial statements in accordance with ISA"
- "SOX 404 internal controls testing"
- "HIPAA compliance assessment"
etc.

---

## Orphaned/Broken Reference Issues

*(To be documented as testing continues)*

---

## Data Flow Break Issues

*(To be documented as testing continues)*

---

## Cross-Module Consistency Issues

*(To be documented as testing continues)*

---

## Summary

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Missing Data | 2 | 0 | 2 | 0 | 0 |
| Inconsistent Data | 1 | 0 | 1 | 0 | 0 |
| Unrealistic Data | 2 | 0 | 0 | 1 | 1 |
| Orphaned Data | 0 | 0 | 0 | 0 | 0 |
| Broken Reference | 0 | 0 | 0 | 0 | 0 |
| Flow Break | 1 | 0 | 1 | 0 | 0 |
| **Total** | 6 | 0 | 4 | 1 | 1 |

---

## Data Quality Score: 2/10

**Major Concerns:**
1. **CRITICAL: Systemic data duplication** - Clients, Workpapers, and Findings all duplicated 8-11x
2. Dashboard metrics don't reconcile with actual data
3. Key aggregations showing zeros when data exists
4. Unrealistic dates undermine demo credibility
5. Broken foreign key relationships (Clients show 0 engagements)

**Before Demo:**
- [ ] **CRITICAL** Clean up duplicate clients (89 → ~8)
- [ ] **CRITICAL** Clean up duplicate workpapers
- [ ] **CRITICAL** Clean up duplicate findings
- [ ] **CRITICAL** Fix client-engagement relationship counts
- [ ] Fix Engagement Health count
- [ ] Fix Team Capacity calculation
- [ ] Fix My Tasks count
- [ ] Update engagement dates to be realistic
- [ ] Add engagement objectives

---

## Root Cause Analysis

### Duplication Issue
The seed script appears to have been run multiple times without cleanup, OR there's a bug where each seed operation creates new records without checking for existing ones.

**Evidence:**
- Clients: "Acme Corporation" (ACME-001) appears exactly 11 times
- Workpapers: "ITGC Testing Matrix" (WP-IT-001) appears exactly 11 times
- All duplicates have identical data except for primary key

**Recommended Fix:**
1. Add `ON CONFLICT DO NOTHING` or `UPSERT` logic to seed scripts
2. Add unique constraints on:
   - `clients.client_code` per `firm_id`
   - `audit_workpapers.workpaper_reference` per `audit_id`
   - `audit_findings.finding_number` per `audit_id`
3. Create a cleanup migration to deduplicate existing records

