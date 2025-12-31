# Obsidian Audit Platform - Data Model Quick Reference

## Document Location
- **Full Documentation:** `OBSIDIAN_DATA_MODEL.md` (1050 lines)
- **Generated:** 2025-12-31

---

## Core Entities at a Glance

### Access Control & Organization (Layer 1)
| Entity | Purpose | Uniqueness | Key Status Fields |
|--------|---------|-----------|-------------------|
| **Organizations** | Multi-tenant boundaries | slug | active → suspended → archived |
| **User Roles** | RBAC mapping | (user_id, org_id, role, project_id) | N/A |
| **Permissions** | Permission definitions | permission_type | N/A |
| **Organization Members** | User membership | (user_id, org_id) | active → suspended → removed |
| **Audit Logs** | Compliance trail | N/A | N/A |

**Key Functions:**
- `has_role(user_id, org_id, role)` - Role check
- `is_org_member(user_id, org_id)` - Membership check
- `has_permission(user_id, org_id, permission)` - Permission verification

---

### Audit Universe & Planning (Layer 2)
| Entity | Purpose | Relationships | Key Status |
|--------|---------|---------------|-----------|
| **Audit Entities** | Auditable items (dept/process/account/system) | Parent-child hierarchy | active → inactive → archived |
| **Risk Assessments** | Entity-level risk evaluation | Entity → Risk Assessment | draft → submitted → approved |
| **Audit Plans** | Period-based planning (annual/quarterly) | Plan → Audits | draft → approved → in_progress → completed |
| **Audits** | Individual engagements (Maps to "engagement" in TypeScript) | Plan → Audit | planned → in_preparation → fieldwork → reporting → closed |
| **Audit Team Members** | Auditor assignments | Audit → Team | N/A (assignment tracking) |

**Risk Dimensions:**
- Inherent Risk = Likelihood (1-5) × Impact (1-5) × 4.0
- Residual Risk = After control effectiveness consideration
- Combined Risk = Inherent × Control effectiveness matrix

---

### Execution & Procedures (Layer 3)
| Entity | Purpose | Type | Lifecycle |
|--------|---------|------|-----------|
| **Audit Programs** | Test plans within audit | Standard/Custom | not_started → in_progress → completed → reviewed |
| **Audit Procedures** | Reusable templates | Template | active/inactive |
| **Engagement Procedures** | Procedure instances per audit | Instance | not_started → in_progress → in_review → complete |
| **Audit Workpapers** | Test documentation | Testing/Analysis/Memo | draft → review → approved |
| **Audit Evidence** | Supporting documentation | Document/Photo/Interview/Calculation | Collected → Verified |
| **Workpaper Signoffs** | Multi-level approvals | preparer/reviewer/manager/partner | pending → completed |

**Procedure Risk Intelligence:**
- Dynamic parameters by risk level (low/medium/high/significant)
- Auto-recommendations based on engagement risk assessment
- Coverage analysis (areas_covered, areas_missing)
- Procedure dependencies (prerequisite, follow_up, related)

---

### Findings & Issues (Layer 4)
| Entity | Purpose | Finding Types | Status Lifecycle |
|--------|---------|---------------|------------------|
| **Audit Findings** | Control deficiencies, misstatements, observations | deficiency/observation/recommendation/non_compliance | open → in_remediation/in_progress → resolved/closed → cleared |
| **Finding Follow-ups** | Remediation tracking | progress_update/evidence_review/verification | Periodic updates with completion % |
| **Finding Linkages** | Procedure-finding relationships | originated_from/impacts/triggers_follow_up/related | active → resolved → not_applicable |

**Finding Classification:**
- Severity: trivial → immaterial → material → significant_deficiency → material_weakness
- Materiality Impact: none → below_trivial → below_performance → performance → planning
- Financial quantification and affected account/area tracking

---

### Materiality & Parameters (Layer 5)
| Entity | Purpose | Benchmark Types | Version Control |
|--------|---------|-----------------|-----------------|
| **Materiality Calculation** | Audit threshold setting | revenue/total_assets/net_income/equity/expenses | version + is_current flag |

**Thresholds:**
- Overall Materiality = Benchmark × % (e.g., revenue × 5%)
- Performance Materiality = 75% of overall
- Clearly Trivial Threshold = 5% of performance
- Component Materiality = For group audits

---

### Engagement Management (Layer 6)
| Entity | Purpose | Status/Type | Workflow |
|--------|---------|----------|----------|
| **Engagement Milestones** | Key dates and deliverables | planning/fieldwork/review/reporting | pending → in_progress → completed → at_risk |
| **Engagement Scope** | Boundaries and assumptions | Included/excluded areas, limitations | Scope change orders for modifications |
| **Engagement Communications** | Interaction tracking | meeting/email/phone_call/status_update/decision | Historical record with action items |
| **Engagement Deliverables** | Output tracking | report/letter/presentation/workpaper | pending → in_progress → review → delivered → accepted/rejected |
| **Engagement Documents** | File management | contract/proposal/scope/workpaper/supporting | Versioned with visibility controls |
| **Engagement Letters** | Formal engagement | Standard/Custom | draft → pending_review → approved → sent → signed |
| **Calendar Events** | Scheduling | fieldwork/meeting/deadline/milestone/travel | pending → synced (with Outlook/Google) |
| **Budget Forecasts** | Cost projection | linear/earned_value/manual | Variance tracking & burn rate snapshots |

---

### Reporting (Layer 7)
| Entity | Purpose | Report Types | Status |
|--------|---------|-------------|--------|
| **Audit Reports** | Formal output | draft/interim/final/management_letter/executive_summary | draft → review → approved → distributed |
| **Audit Metrics** | KPI dashboards | audit_cycle_time/finding_resolution_rate/budget_variance | Time-series snapshots |

---

### Additional Tools
| Module | Purpose | Key Features |
|--------|---------|--------------|
| **Confirmations Tracker** | External confirmations (AR/AP/Bank/Legal) | Response tracking, exception handling, overdue management |
| **Sampling** | Statistical sampling | Sample size calculation, confidence level, deviation rate |
| **Trial Balance** | GL reconciliation | Period analysis, account classification |
| **Time Entries** | Resource tracking | Hour aggregation, billable tracking |
| **Quality Control** | EQCR process | Checklist completion, partner sign-off |

---

## TypeScript Type System Organization

Located in: `/src/types/`

### Core Type Files
1. **risk-assessment.ts** - Risk evaluation types
   - EngagementRiskAssessment, RiskAreaAssessment
   - FraudRiskAssessment (Fraud Triangle), ITRiskAssessment
   - Risk matrices and helper functions

2. **procedures.ts** - Audit procedure types
   - AuditProcedure (template), EngagementProcedure (instance)
   - ProcedureRecommendation, ProcedureWorkspace
   - SignOff workflow, Execution history

3. **findings.ts** - Audit finding types
   - AuditFinding with materiality impact
   - FindingLinkage, FindingEvidence, FindingComment
   - Analytics: statistics, dashboard data

4. **materiality.ts** - Materiality calculation types
   - MaterialityCalculation with version control
   - BenchmarkType enum (revenue, assets, income, etc.)
   - Industry guidance

5. **confirmations.ts** - Confirmation tracking types
   - Confirmation with status lifecycle
   - ConfirmationType enum (AR, AP, Bank, Legal, etc.)
   - Exception and response tracking

6. **professional-standards.ts** - Compliance types
   - Audit standards support (SOX, IFRS, GAAP, GDPR, ISO27001)

---

## Key Design Patterns

### Multi-Tenancy
- `organization_id` on all core tables
- RLS enforces org-level isolation
- Users can belong to multiple orgs

### Soft Deletes
- Status enums instead of hard DELETE
- Preserve historical data
- Audit trail completeness

### Versioning
- `version` + `is_current` flags
- Create new version for changes
- Immutable approval history

### JSONB Extensibility
- `metadata` on core entities
- Store complex nested structures
- Add fields without schema changes

### Type Safety
- Strong TypeScript interfaces
- Enum types for status/type fields
- Helper functions for UI rendering

---

## Critical Relationships

### Containment Hierarchy
```
Organization
  ├─ Audit Plan
  │   └─ Audit (Engagement)
  │       ├─ Audit Program
  │       │   └─ Engagement Procedure
  │       │       ├─ Workpaper
  │       │       │   ├─ Evidence
  │       │       │   └─ Signoffs
  │       │       └─ Review Notes
  │       └─ Findings
  │           ├─ Follow-ups
  │           └─ Linkages
  ├─ Audit Procedures (templates)
  ├─ Risk Assessments
  └─ Materiality Calculations
```

### Many-to-Many
- **Users ↔ Organizations** via organization_members
- **Roles ↔ Permissions** via role_permissions
- **Procedures ↔ Risk Areas** via procedure_risk_mappings

---

## Lifecycle Patterns

### Engagement Lifecycle
```
planned → in_preparation → fieldwork → reporting → closed
```

### Finding Lifecycle
```
open → in_remediation → resolved/accepted_risk → cleared
```

### Procedure Workflow
```
not_started → in_progress → in_review → complete (or not_applicable)
```

### Workpaper Sign-off
```
Preparer Signs → Reviewer Reviews → Manager Reviews → Partner Approves
```

---

## Compliance & Security

### Audit Standards
- SOX (Sarbanes-Oxley) - IT controls, ICFR
- IFRS - International accounting
- GAAP - US accounting
- GDPR - Data privacy
- ISO 27001 - Information security
- SSAE 18 - Service auditor standards

### Data Protection
- Row-Level Security (RLS) on all critical tables
- Organization isolation (no cross-org data leakage)
- Audit log tracking of all changes
- User attribution on key operations
- Timestamps (created_at, updated_at) on all entities

### Access Control
- Role-based (8 predefined roles)
- Permission-based (22+ granular permissions)
- Project-scoped and org-wide roles
- SECURITY DEFINER functions to avoid RLS recursion

---

## Statistics

- **Total Tables:** 50+ (audit core + engagement management + utilities)
- **TypeScript Types:** 100+ interfaces
- **Enum Types:** 50+ status/type enumerations
- **Foreign Keys:** 100+ relationships
- **Indexes:** 30+ performance indexes
- **RLS Policies:** 40+ access policies
- **Supported Standards:** 6 major audit frameworks
- **Team Roles:** 8 predefined roles + custom project roles

---

## Quick Navigation

| Topic | Location in Full Doc | Key Section |
|-------|--------|-----------|
| Organization setup | Section 1 | Organizations, User Roles, Permissions |
| Audit planning | Section 2 | Audit Entities, Plans, Risk Assessment |
| Execution | Section 3 | Programs, Procedures, Workpapers, Evidence |
| Findings | Section 4 | Findings, Follow-ups, Linkages |
| Reporting | Section 7 | Reports, Metrics, Analytics |
| Security | Section 13 | RLS, Data Protection, RBAC |

---

## Related Files

- **TypeScript Types:** `/src/types/`
- **Database Schema:** `/supabase/migrations/`
- **Core Migrations:**
  - `20251108042608_remix_batch_27_migrations.sql` - Base schema
  - `20251112005424_eed76bec-1864-4b1f-8efe-25648e083061.sql` - Audit core
  - `20251122221147_d69b87a8-73fa-480b-a9a3-caf15aa433ef.sql` - Engagements
  - `20251122224933_79d04fd8-a3f0-44e1-b686-d3f4f3c91af4.sql` - Procedures/Programs
  - `20251129000001_create_audit_tools_tables.sql` - Audit tools (sampling, adjustments)

---

## For Developers

### Common Queries
1. **Get organization audits:** Filter by org_id and status
2. **Get audit findings:** Join audits → findings, filter by severity/status
3. **Check procedure progress:** Count engagement_procedures by status
4. **Find overdue confirmations:** Query confirmation dates vs current_date

### Common Mutations
1. **Create audit:** Insert audit → Initialize programs → Create procedures
2. **Complete procedure:** Update status → Request review → Approve
3. **Create finding:** Insert finding → Link to procedure → Create follow-ups
4. **Close audit:** Resolve all findings → Finalize report → Update status

---

*Complete documentation available in: OBSIDIAN_DATA_MODEL.md*

