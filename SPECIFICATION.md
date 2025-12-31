# Obsidian Audit - System Specification Document

## Document Control
- **Version**: 1.0
- **Last Updated**: December 2024
- **Classification**: Internal Use Only

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Audit Methodology Foundation](#2-audit-methodology-foundation)
3. [Functional Requirements by Module](#3-functional-requirements-by-module)
4. [Data Architecture](#4-data-architecture)
5. [Compliance & Standards Alignment](#5-compliance--standards-alignment)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Integration Requirements](#7-integration-requirements)
8. [Implementation Priority](#8-implementation-priority)

---

## 1. Executive Summary

### 1.1 Purpose

Obsidian Audit is an enterprise audit execution platform for professional audit firms conducting external audits (financial statement audits, SOC audits, compliance audits, IT audits). The system manages the complete audit lifecycle from planning through reporting, with a focus on **workpaper quality**, **evidence integrity**, and **review workflow enforcement**.

### 1.2 Scope

This specification covers the **audit execution engine** only. It explicitly excludes:
- CRM/Client relationship management
- Time tracking and billing
- Resource scheduling
- Client portal (separate product)

### 1.3 Target Users

| Role | Primary Functions |
|------|------------------|
| **Partner** | Engagement sign-off, quality review, opinion issuance |
| **Manager** | Engagement supervision, procedure review, finding review |
| **Senior Auditor** | Procedure execution, workpaper preparation, staff supervision |
| **Staff Auditor** | Procedure execution, evidence collection, workpaper preparation |

### 1.4 Success Criteria

1. An experienced auditor can execute a complete audit engagement using only this system
2. All workpapers meet PCAOB AS 1215 / ISA 230 documentation standards
3. Complete audit trail survives regulatory inspection
4. Multi-level review workflow is enforced, not optional
5. Evidence chain-of-custody is provable

---

## 2. Audit Methodology Foundation

### 2.1 Governing Standards

The system MUST support audit methodologies compliant with:

| Standard | Jurisdiction | Key Requirements |
|----------|--------------|------------------|
| **PCAOB AS 1215** | US Public Companies | Audit documentation, 7-year retention |
| **PCAOB AS 2301** | US Public Companies | Response to risk of material misstatement |
| **PCAOB AS 2315** | US Public Companies | Audit sampling |
| **ISA 230** | International | Audit documentation |
| **ISA 500** | International | Audit evidence |
| **ISA 530** | International | Audit sampling |
| **AICPA AU-C 230** | US Private Companies | Audit documentation |
| **AICPA AU-C 330** | US Private Companies | Performing audit procedures |

### 2.2 Audit Lifecycle Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUDIT ENGAGEMENT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. ACCEPTANCE &     2. PLANNING        3. FIELDWORK      4. COMPLETION     │
│     CONTINUANCE                                                              │
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │ Engagement  │    │ Risk        │    │ Procedure   │    │ Findings    │   │
│  │ Letter      │───▶│ Assessment  │───▶│ Execution   │───▶│ Evaluation  │   │
│  │             │    │             │    │             │    │             │   │
│  │ Independence│    │ Materiality │    │ Evidence    │    │ Report      │   │
│  │ Assessment  │    │ Calculation │    │ Collection  │    │ Drafting    │   │
│  │             │    │             │    │             │    │             │   │
│  │ Client      │    │ Audit       │    │ Workpaper   │    │ Partner     │   │
│  │ Acceptance  │    │ Strategy    │    │ Documentation   │ Sign-off    │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                              │
│  GATES:              Risk assessment    All procedures    Partner sign-off   │
│                      approved           reviewed          required for       │
│                                                          report release      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Required Audit Assertions

For each significant account, the system must track testing of assertions:

**Balance Sheet Assertions:**
- Existence - Assets/liabilities exist at period end
- Rights & Obligations - Entity has rights to assets and obligations for liabilities
- Completeness - All items that should be recorded are recorded
- Valuation & Allocation - Items are recorded at appropriate amounts

**Income Statement Assertions:**
- Occurrence - Transactions actually occurred
- Completeness - All transactions are recorded
- Accuracy - Transactions are recorded at correct amounts
- Cutoff - Transactions are recorded in correct period
- Classification - Transactions are recorded in proper accounts

**Presentation & Disclosure Assertions:**
- Occurrence and Rights & Obligations
- Completeness
- Classification and Understandability
- Accuracy and Valuation

---

## 3. Functional Requirements by Module

### 3.1 Engagement Management

#### 3.1.1 Engagement Setup

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| ENG-001 | Create engagement with client, fiscal year end, engagement type | Must | - |
| ENG-002 | Define engagement team with roles (Partner, Manager, Senior, Staff) | Must | AS 1215.04 |
| ENG-003 | Set engagement milestones and deadlines | Must | - |
| ENG-004 | Configure engagement-level settings (methodology, materiality basis) | Must | - |
| ENG-005 | Import prior year engagement as template | Should | - |
| ENG-006 | Define engagement phases with gates/approvals between phases | Must | - |
| ENG-007 | Track budgeted vs actual hours by phase | Should | - |

#### 3.1.2 Engagement Status & Progress

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| ENG-010 | Dashboard showing engagement completion percentage | Must |
| ENG-011 | Breakdown of completion by audit area | Must |
| ENG-012 | Identification of blocking items (unsigned workpapers, open review notes) | Must |
| ENG-013 | Days to deadline tracking | Must |
| ENG-014 | Automatic status rollup from procedures to programs to engagement | Must |

### 3.2 Risk Assessment

#### 3.2.1 Risk Assessment Process

The system must enforce a risk-based audit approach per AS 2110/ISA 315:

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| RISK-001 | Define audit universe (account areas to be audited) | Must | AS 2110 |
| RISK-002 | Assess inherent risk per account area (High/Moderate/Low) | Must | AS 2110.59 |
| RISK-003 | Assess control risk per account area (High/Moderate/Low) | Must | AS 2110.60 |
| RISK-004 | Assess fraud risk per account area | Must | AS 2401 |
| RISK-005 | Calculate combined risk (inherent × control) | Must | AS 2110.61 |
| RISK-006 | Document risk rationale with supporting factors | Must | AS 1215 |
| RISK-007 | Link risks to specific assertions | Must | AS 2110.71 |
| RISK-008 | Generate risk heat map visualization | Should | - |
| RISK-009 | Risk assessment must be approved before fieldwork begins | Must | AS 2110.04 |
| RISK-010 | Support significant risk identification | Must | AS 2110.70 |

#### 3.2.2 Risk-Based Procedure Selection

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| RISK-020 | System suggests procedures based on risk level | Must |
| RISK-021 | High-risk areas require more extensive procedures | Must |
| RISK-022 | Significant risks require substantive procedures (not just analytical) | Must |
| RISK-023 | Fraud risks require specific fraud-focused procedures | Must |
| RISK-024 | Sample sizes scale with risk level | Must |
| RISK-025 | Allow override of suggested procedures with documented rationale | Must |

### 3.3 Materiality

#### 3.3.1 Materiality Calculation

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| MAT-001 | Calculate overall materiality from benchmark (revenue, assets, equity, income) | Must | AS 2105 |
| MAT-002 | Support percentage-based calculation with industry guidance | Must | - |
| MAT-003 | Calculate performance materiality (typically 50-75% of overall) | Must | AS 2105.10 |
| MAT-004 | Calculate clearly trivial threshold (typically 5% of overall) | Must | AS 2105.11 |
| MAT-005 | Support component materiality allocation for group audits | Should | - |
| MAT-006 | Document materiality rationale | Must | AS 1215 |
| MAT-007 | Track materiality revision triggers | Must | AS 2105.13 |
| MAT-008 | Alert when accumulated misstatements approach materiality | Must | - |

#### 3.3.2 Materiality Throughout Engagement

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| MAT-010 | Materiality visible on all workpapers for context | Must |
| MAT-011 | Alert when testing item exceeds performance materiality | Must |
| MAT-012 | Require re-evaluation of procedures if materiality revised downward | Must |
| MAT-013 | Summary of Audit Misstatements (SAM) auto-calculated | Must |

### 3.4 Audit Programs & Procedures

#### 3.4.1 Program Library

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| PROG-001 | Maintain library of standard audit programs by account area | Must |
| PROG-002 | Programs organized by account/cycle (Revenue, Purchasing, Payroll, etc.) | Must |
| PROG-003 | Each program contains procedures addressing specific assertions | Must |
| PROG-004 | Support firm-specific customization of standard programs | Must |
| PROG-005 | Version control for program templates | Must |
| PROG-006 | Import/export programs in standard format | Should |

#### 3.4.2 Procedure Definition

Each procedure MUST capture:

| Field | Required | Description |
|-------|----------|-------------|
| Procedure Number | Yes | Unique identifier within program (e.g., "A-100") |
| Procedure Type | Yes | Test of Controls / Substantive Test / Analytical Procedure / Inquiry / Observation / Inspection |
| Description | Yes | What the auditor must do |
| Assertion(s) Addressed | Yes | Which assertions this procedure tests |
| Objective | Yes | What the procedure is designed to detect |
| Expected Evidence | Yes | What documentation is expected |
| Risk Level Link | Yes | Which risk assessment this addresses |
| Estimated Hours | No | Budget for this procedure |
| Assigned To | Yes | Staff member responsible |
| Due Date | No | Expected completion |

#### 3.4.3 Procedure Execution

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| PROC-001 | Procedure status: Not Started → In Progress → Pending Review → Reviewed → Signed Off | Must | - |
| PROC-002 | Cannot skip status (must go through review before sign-off) | Must | AS 1201 |
| PROC-003 | Document work performed (what the auditor actually did) | Must | AS 1215.05 |
| PROC-004 | Document sample selected (if applicable) | Must | AS 2315 |
| PROC-005 | Document results obtained | Must | AS 1215.05 |
| PROC-006 | Document exceptions identified | Must | AS 1215.05 |
| PROC-007 | Document conclusion reached | Must | AS 1215.05 |
| PROC-008 | Link to supporting workpapers | Must | AS 1215.04 |
| PROC-009 | Link to evidence collected | Must | AS 1215.04 |
| PROC-010 | Capture who performed and when | Must | AS 1215.06 |
| PROC-011 | Capture who reviewed and when | Must | AS 1215.06 |
| PROC-012 | Cannot complete procedure without work performed and conclusion | Must | - |
| PROC-013 | Exceptions require documented resolution before sign-off | Must | - |

### 3.5 Workpapers

#### 3.5.1 Workpaper Structure

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| WP-001 | Hierarchical workpaper organization (Binder → Section → Workpaper) | Must | - |
| WP-002 | Standard workpaper index (Lead schedules, PBC, etc.) | Must | - |
| WP-003 | Unique reference number for each workpaper | Must | AS 1215.04 |
| WP-004 | Workpaper header with engagement, client, preparer, reviewer, dates | Must | AS 1215.06 |
| WP-005 | Cross-reference to related workpapers | Must | AS 1215.04 |
| WP-006 | Tick mark legend per workpaper or engagement-wide | Must | - |

#### 3.5.2 Workpaper Content

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| WP-010 | Rich text editor for narrative workpapers | Must |
| WP-011 | Spreadsheet/tabular data entry | Must |
| WP-012 | Cell-level tick marks with meaning | Must |
| WP-013 | Cell-level cross-references to other workpapers | Must |
| WP-014 | Embedded evidence (images, document links) | Must |
| WP-015 | Formulas for calculations (with verification) | Should |
| WP-016 | Standard templates (Lead schedule, Reconciliation, etc.) | Must |

#### 3.5.3 Tick Mark System

The system MUST support standard tick marks:

| Symbol | Meaning | Usage |
|--------|---------|-------|
| √ | Tested/Verified | Item has been tested and found correct |
| F | Footed | Column totals verified for mathematical accuracy |
| XF | Cross-footed | Row totals verified for mathematical accuracy |
| T | Traced | Traced to source document |
| A | Agreed | Agreed to general ledger or financial statements |
| C | Confirmed | Confirmed with external party |
| R | Recomputed | Calculation verified |
| ? | Question | Requires follow-up |
| PY | Prior Year | Compared to prior year |
| N/A | Not Applicable | Procedure not applicable to this item |
| Custom | User-defined | Firm-specific tick marks |

**Requirements:**
| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| TICK-001 | Apply tick mark to specific cell/item | Must |
| TICK-002 | Each tick mark must have documented meaning | Must |
| TICK-003 | Tick mark can link to evidence | Should |
| TICK-004 | Tick mark legend visible on workpaper | Must |
| TICK-005 | Firm can define custom tick marks | Should |
| TICK-006 | Track who applied tick mark and when | Must |

#### 3.5.4 Workpaper Versioning

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| VER-001 | Every save creates new version | Must | AS 1215.15 |
| VER-002 | Version history shows who changed what when | Must | AS 1215.16 |
| VER-003 | Can view any prior version | Must | AS 1215.15 |
| VER-004 | Can compare versions (diff view) | Should | - |
| VER-005 | Cannot delete or modify after sign-off (immutable) | Must | AS 1215.16 |
| VER-006 | Changes after sign-off invalidate sign-off | Must | AS 1215.16 |
| VER-007 | All versions retained for required period (7 years PCAOB) | Must | AS 1215.14 |

#### 3.5.5 Workpaper Locking

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| LOCK-001 | Only one user can edit workpaper at a time | Must |
| LOCK-002 | Show who currently has workpaper locked | Must |
| LOCK-003 | Lock timeout after inactivity | Should |
| LOCK-004 | Force unlock by supervisor if needed | Should |

### 3.6 Evidence Management

#### 3.6.1 Evidence Collection

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| EVID-001 | Upload evidence files (PDF, Excel, images, etc.) | Must | ISA 500 |
| EVID-002 | Capture evidence metadata (source, date received, provider) | Must | ISA 500.A31 |
| EVID-003 | Generate SHA-256 hash on upload for integrity | Must | - |
| EVID-004 | Classify evidence source (client, third-party, internally generated) | Must | ISA 500.A31 |
| EVID-005 | Evidence cannot be modified after upload | Must | - |
| EVID-006 | Evidence can be re-requested (new version) if updated | Must | - |
| EVID-007 | Virus scanning on upload | Must | - |

#### 3.6.2 Evidence Linking

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| EVID-010 | Link evidence to specific procedure | Must |
| EVID-011 | Link evidence to specific workpaper cell | Should |
| EVID-012 | Link evidence to specific finding | Must |
| EVID-013 | One evidence file can link to multiple procedures | Must |
| EVID-014 | Show all procedures/workpapers using evidence | Must |

#### 3.6.3 Chain of Custody

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| EVID-020 | Log every access (view, download) | Must |
| EVID-021 | Log who accessed, when, from where | Must |
| EVID-022 | Verify hash on access (detect tampering) | Must |
| EVID-023 | Generate chain of custody report | Must |

### 3.7 Sampling

#### 3.7.1 Sample Size Calculation

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| SAMP-001 | Monetary Unit Sampling (MUS) calculation | Must | AS 2315 |
| SAMP-002 | Classical Variables Sampling | Should | AS 2315 |
| SAMP-003 | Attributes Sampling (for test of controls) | Must | AS 2315 |
| SAMP-004 | Inputs: Population size, materiality, expected misstatement, confidence | Must | - |
| SAMP-005 | Calculate sample size based on inputs | Must | AS 2315.11 |
| SAMP-006 | Document sampling rationale | Must | AS 2315.15 |

#### 3.7.2 Sample Selection

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| SAMP-010 | Random selection from population | Must |
| SAMP-011 | Systematic selection with random start | Should |
| SAMP-012 | Haphazard selection with documentation | Should |
| SAMP-013 | Stratified sampling support | Should |
| SAMP-014 | Document selection method | Must |
| SAMP-015 | Export sample list | Must |

#### 3.7.3 Sample Results

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| SAMP-020 | Record results for each sample item | Must |
| SAMP-021 | Calculate projected misstatement from sample | Must |
| SAMP-022 | Compare to tolerable misstatement | Must |
| SAMP-023 | Conclude on population based on sample | Must |
| SAMP-024 | Alert if sample results exceed expectations | Must |

### 3.8 Review & Sign-off

#### 3.8.1 Review Workflow

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| REV-001 | Multi-level review: Preparer → Reviewer → Manager → Partner | Must | AS 1201 |
| REV-002 | Each level must sign before next level can review | Must | - |
| REV-003 | Configurable review levels per firm | Should | - |
| REV-004 | Review notes/comments by reviewer | Must | - |
| REV-005 | Review notes require response before sign-off | Must | - |
| REV-006 | Review note status: Open → Responded → Resolved | Must | - |
| REV-007 | Cannot sign off with open review notes | Must | - |

#### 3.8.2 Review Notes

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| REV-010 | Create review note on specific workpaper/procedure | Must |
| REV-011 | Review note type: Question / Comment / Action Required | Must |
| REV-012 | Review note priority: Low / Medium / High | Must |
| REV-013 | Assign review note to specific person | Must |
| REV-014 | Track response to review note | Must |
| REV-015 | Reviewer can mark as resolved or re-open | Must |
| REV-016 | Review notes aging report | Should |

#### 3.8.3 Digital Sign-off

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| SIGN-001 | Electronic signature with timestamp | Must | AS 1215.06 |
| SIGN-002 | Capture content hash at time of signature | Must | - |
| SIGN-003 | Sign-off is immutable once applied | Must | AS 1215.16 |
| SIGN-004 | Sign-off levels: Preparer / Reviewer / Manager / Partner | Must | - |
| SIGN-005 | Sign-off invalidated if content changes | Must | AS 1215.16 |
| SIGN-006 | Re-sign required after changes | Must | - |
| SIGN-007 | Show sign-off status visually (badges/icons) | Must | - |
| SIGN-008 | Prevent engagement completion without required sign-offs | Must | - |

### 3.9 Findings & Adjustments

#### 3.9.1 Finding Documentation

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| FIND-001 | Create finding linked to procedure | Must |
| FIND-002 | Finding severity: Critical / High / Moderate / Low | Must |
| FIND-003 | Finding category: Misstatement / Control Deficiency / Compliance / Other | Must |
| FIND-004 | Document condition (what was found) | Must |
| FIND-005 | Document criteria (what should be) | Must |
| FIND-006 | Document cause | Should |
| FIND-007 | Document effect/impact | Must |
| FIND-008 | Document recommendation | Must |
| FIND-009 | Capture management response | Must |
| FIND-010 | Finding status: Open → In Progress → Resolved → Closed | Must |

#### 3.9.2 Audit Adjustments

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| ADJ-001 | Record proposed audit adjustment | Must |
| ADJ-002 | Adjustment type: AJE (Adjusting) / PJE (Passed/Waived) / RJE (Reclassifying) | Must |
| ADJ-003 | Debit/credit accounts and amounts | Must |
| ADJ-004 | Link adjustment to finding | Must |
| ADJ-005 | Track if adjustment was posted by client | Must |
| ADJ-006 | Summary of Audit Misstatements (SAM) schedule | Must |
| ADJ-007 | Compare SAM to materiality thresholds | Must |
| ADJ-008 | Roll-forward passed adjustments from prior year | Should |

### 3.10 Analytical Procedures

#### 3.10.1 Planning Analytics

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| ANAL-001 | Year-over-year comparison | Must | AS 2305 |
| ANAL-002 | Industry benchmark comparison | Should | - |
| ANAL-003 | Budget to actual comparison | Should | - |
| ANAL-004 | Ratio analysis (liquidity, profitability, etc.) | Must | - |
| ANAL-005 | Trend analysis | Must | - |
| ANAL-006 | Document expectation before analysis | Must | AS 2305.09 |

#### 3.10.2 Substantive Analytics

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| ANAL-010 | Define threshold for investigation | Must |
| ANAL-011 | Calculate variance from expectation | Must |
| ANAL-012 | Flag variances exceeding threshold | Must |
| ANAL-013 | Document investigation of variances | Must |
| ANAL-014 | Document corroborating evidence | Must |
| ANAL-015 | Conclude on reasonableness | Must |

### 3.11 Confirmations

#### 3.11.1 Confirmation Process

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| CONF-001 | Create confirmation request | Must |
| CONF-002 | Confirmation type: AR / AP / Bank / Legal / Other | Must |
| CONF-003 | Track confirmation status: Draft → Sent → Received → Exception → Resolved | Must |
| CONF-004 | Generate confirmation letter from template | Should |
| CONF-005 | Track date sent | Must |
| CONF-006 | Track date received | Must |
| CONF-007 | Document response details | Must |
| CONF-008 | Document exceptions and resolution | Must |
| CONF-009 | Second request tracking | Should |
| CONF-010 | Alternative procedures if no response | Must |

### 3.12 Reporting

#### 3.12.1 Internal Reports

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| RPT-001 | Engagement status report | Must |
| RPT-002 | Open items report | Must |
| RPT-003 | Review notes aging report | Must |
| RPT-004 | Time budget vs actual report | Should |
| RPT-005 | Risk assessment summary | Must |
| RPT-006 | Findings summary | Must |
| RPT-007 | SAM schedule | Must |

#### 3.12.2 Audit Report Generation

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| RPT-010 | Draft audit opinion report | Must |
| RPT-011 | Opinion types: Unmodified / Qualified / Adverse / Disclaimer | Must |
| RPT-012 | Insert findings into report | Must |
| RPT-013 | Version control for report drafts | Must |
| RPT-014 | Partner approval required for final | Must |
| RPT-015 | PDF export with watermark for draft | Must |
| RPT-016 | Final report locked after issuance | Must |

### 3.13 Audit Trail & Compliance

#### 3.13.1 Comprehensive Logging

| Requirement ID | Requirement | Priority | Standard Reference |
|---------------|-------------|----------|-------------------|
| LOG-001 | Log all data access (who viewed what when) | Must | AS 1215 |
| LOG-002 | Log all data modifications (who changed what when) | Must | AS 1215.16 |
| LOG-003 | Log all sign-offs | Must | AS 1215.06 |
| LOG-004 | Log all evidence access | Must | - |
| LOG-005 | Log authentication events | Must | - |
| LOG-006 | Logs are immutable (write-only) | Must | - |
| LOG-007 | Logs retained for 7 years minimum | Must | AS 1215.14 |

#### 3.13.2 Data Retention

| Requirement ID | Requirement | Priority |
|---------------|-------------|----------|
| RET-001 | Engagement data retained for 7 years (PCAOB) | Must |
| RET-002 | Private company data retained for 5 years (AICPA) | Must |
| RET-003 | Legal hold capability (prevent deletion) | Must |
| RET-004 | Automated archival after retention period | Should |
| RET-005 | Export for regulatory request | Must |

---

## 4. Data Architecture

### 4.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE DATA MODEL                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ENGAGEMENT                                                                  │
│  ├── engagement_id (PK)                                                     │
│  ├── firm_id (FK)                                                           │
│  ├── client_id (FK)                                                         │
│  ├── fiscal_year_end                                                        │
│  ├── engagement_type                                                        │
│  ├── status                                                                 │
│  ├── materiality_amount                                                     │
│  ├── performance_materiality                                                │
│  └── clearly_trivial                                                        │
│                                                                              │
│  RISK_ASSESSMENT                                                             │
│  ├── risk_id (PK)                                                           │
│  ├── engagement_id (FK)                                                     │
│  ├── account_area                                                           │
│  ├── inherent_risk                                                          │
│  ├── control_risk                                                           │
│  ├── fraud_risk                                                             │
│  ├── combined_risk                                                          │
│  ├── significant_risk (boolean)                                             │
│  └── assertions_affected (array)                                            │
│                                                                              │
│  AUDIT_PROGRAM                                                               │
│  ├── program_id (PK)                                                        │
│  ├── engagement_id (FK)                                                     │
│  ├── account_area                                                           │
│  ├── assertions_covered (array)                                             │
│  └── risk_id (FK)                                                           │
│                                                                              │
│  AUDIT_PROCEDURE                                                             │
│  ├── procedure_id (PK)                                                      │
│  ├── program_id (FK)                                                        │
│  ├── procedure_number                                                       │
│  ├── procedure_type                                                         │
│  ├── description                                                            │
│  ├── assertions (array)                                                     │
│  ├── status                                                                 │
│  ├── assigned_to (FK)                                                       │
│  ├── work_performed                                                         │
│  ├── conclusion                                                             │
│  ├── exceptions                                                             │
│  ├── completed_by (FK)                                                      │
│  ├── completed_at                                                           │
│  ├── reviewed_by (FK)                                                       │
│  └── reviewed_at                                                            │
│                                                                              │
│  WORKPAPER                                                                   │
│  ├── workpaper_id (PK)                                                      │
│  ├── engagement_id (FK)                                                     │
│  ├── procedure_id (FK) nullable                                             │
│  ├── reference_number (unique per engagement)                               │
│  ├── title                                                                  │
│  ├── section                                                                │
│  ├── content (JSONB)                                                        │
│  ├── preparer_id (FK)                                                       │
│  ├── prepared_at                                                            │
│  └── current_version                                                        │
│                                                                              │
│  WORKPAPER_VERSION                                                           │
│  ├── version_id (PK)                                                        │
│  ├── workpaper_id (FK)                                                      │
│  ├── version_number                                                         │
│  ├── content (JSONB)                                                        │
│  ├── content_hash (SHA-256)                                                 │
│  ├── changed_by (FK)                                                        │
│  ├── change_summary                                                         │
│  └── created_at                                                             │
│                                                                              │
│  TICK_MARK                                                                   │
│  ├── tick_mark_id (PK)                                                      │
│  ├── workpaper_id (FK)                                                      │
│  ├── cell_reference                                                         │
│  ├── symbol                                                                 │
│  ├── meaning                                                                │
│  ├── evidence_id (FK) nullable                                              │
│  ├── created_by (FK)                                                        │
│  └── created_at                                                             │
│                                                                              │
│  EVIDENCE                                                                    │
│  ├── evidence_id (PK)                                                       │
│  ├── engagement_id (FK)                                                     │
│  ├── original_filename                                                      │
│  ├── storage_path                                                           │
│  ├── file_hash (SHA-256)                                                    │
│  ├── file_size                                                              │
│  ├── mime_type                                                              │
│  ├── source_type (client/third_party/internal)                              │
│  ├── source_contact                                                         │
│  ├── date_received                                                          │
│  ├── uploaded_by (FK)                                                       │
│  └── uploaded_at                                                            │
│                                                                              │
│  EVIDENCE_LINK                                                               │
│  ├── link_id (PK)                                                           │
│  ├── evidence_id (FK)                                                       │
│  ├── entity_type (procedure/workpaper/finding)                              │
│  ├── entity_id                                                              │
│  ├── linked_by (FK)                                                         │
│  └── linked_at                                                              │
│                                                                              │
│  SIGNOFF                                                                     │
│  ├── signoff_id (PK)                                                        │
│  ├── entity_type (procedure/workpaper/program/engagement)                   │
│  ├── entity_id                                                              │
│  ├── signoff_level (preparer/reviewer/manager/partner)                      │
│  ├── signed_by (FK)                                                         │
│  ├── signed_at                                                              │
│  ├── content_hash (SHA-256)                                                 │
│  ├── is_valid (boolean)                                                     │
│  ├── invalidated_at                                                         │
│  └── invalidated_reason                                                     │
│                                                                              │
│  REVIEW_NOTE                                                                 │
│  ├── note_id (PK)                                                           │
│  ├── entity_type                                                            │
│  ├── entity_id                                                              │
│  ├── note_type (question/comment/action_required)                           │
│  ├── priority (low/medium/high)                                             │
│  ├── content                                                                │
│  ├── status (open/responded/resolved)                                       │
│  ├── created_by (FK)                                                        │
│  ├── created_at                                                             │
│  ├── response                                                               │
│  ├── responded_by (FK)                                                      │
│  ├── responded_at                                                           │
│  ├── resolved_by (FK)                                                       │
│  └── resolved_at                                                            │
│                                                                              │
│  FINDING                                                                     │
│  ├── finding_id (PK)                                                        │
│  ├── engagement_id (FK)                                                     │
│  ├── procedure_id (FK) nullable                                             │
│  ├── severity (critical/high/moderate/low)                                  │
│  ├── category (misstatement/control_deficiency/compliance/other)            │
│  ├── condition                                                              │
│  ├── criteria                                                               │
│  ├── cause                                                                  │
│  ├── effect                                                                 │
│  ├── recommendation                                                         │
│  ├── management_response                                                    │
│  ├── status (open/in_progress/resolved/closed)                              │
│  ├── identified_by (FK)                                                     │
│  └── identified_at                                                          │
│                                                                              │
│  AUDIT_ADJUSTMENT                                                            │
│  ├── adjustment_id (PK)                                                     │
│  ├── engagement_id (FK)                                                     │
│  ├── finding_id (FK) nullable                                               │
│  ├── adjustment_type (aje/pje/rje)                                          │
│  ├── entry_number                                                           │
│  ├── description                                                            │
│  ├── debit_account                                                          │
│  ├── credit_account                                                         │
│  ├── amount                                                                 │
│  ├── posted (boolean)                                                       │
│  ├── created_by (FK)                                                        │
│  ├── approved_by (FK) nullable                                              │
│  └── approved_at                                                            │
│                                                                              │
│  AUDIT_LOG (Immutable)                                                       │
│  ├── log_id (PK)                                                            │
│  ├── timestamp                                                              │
│  ├── user_id                                                                │
│  ├── action (view/create/update/delete/signoff)                             │
│  ├── entity_type                                                            │
│  ├── entity_id                                                              │
│  ├── old_values (JSONB)                                                     │
│  ├── new_values (JSONB)                                                     │
│  ├── ip_address                                                             │
│  └── user_agent                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Multi-Tenancy

- All tables include `firm_id` for tenant isolation
- Row-Level Security (RLS) policies enforce tenant boundaries
- Users can only access data within their firm
- Cross-firm data access is impossible at the database level

---

## 5. Compliance & Standards Alignment

### 5.1 PCAOB Compliance

| Standard | System Feature |
|----------|----------------|
| AS 1215 - Audit Documentation | Workpaper versioning, retention, sign-off tracking |
| AS 1201 - Supervision of Audit | Multi-level review workflow |
| AS 2101 - Audit Planning | Engagement setup, risk assessment |
| AS 2105 - Materiality | Materiality calculator, threshold tracking |
| AS 2110 - Risk Assessment | Risk assessment module |
| AS 2301 - Response to Risk | Risk-based procedure selection |
| AS 2315 - Audit Sampling | Sampling calculator, documentation |
| AS 2401 - Fraud | Fraud risk assessment |

### 5.2 ISA Compliance

| Standard | System Feature |
|----------|----------------|
| ISA 230 - Audit Documentation | Workpaper versioning, retention |
| ISA 315 - Risk Assessment | Risk assessment module |
| ISA 330 - Auditor's Response | Procedure execution |
| ISA 500 - Audit Evidence | Evidence management, chain of custody |
| ISA 530 - Audit Sampling | Sampling calculator |

### 5.3 SOC 2 Requirements for the Platform Itself

The platform must implement controls to achieve SOC 2 Type II attestation:

| Trust Criteria | Implementation |
|----------------|----------------|
| Security | MFA, encryption, access controls, penetration testing |
| Availability | 99.9% uptime SLA, disaster recovery |
| Confidentiality | Data encryption, access logging |
| Processing Integrity | Hash verification, audit trails |
| Privacy | Data retention policies, user consent |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds |
| Workpaper save | < 1 second |
| Search results | < 3 seconds |
| Report generation | < 30 seconds |
| Concurrent users per engagement | 50+ |

### 6.2 Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | SSO (SAML 2.0), MFA required |
| Authorization | Role-based access control |
| Data encryption at rest | AES-256 |
| Data encryption in transit | TLS 1.3 |
| Password policy | 12+ characters, complexity requirements |
| Session timeout | Configurable (default 30 minutes) |
| IP allowlisting | Optional per firm |

### 6.3 Availability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.9% |
| RTO (Recovery Time Objective) | 4 hours |
| RPO (Recovery Point Objective) | 1 hour |
| Backup frequency | Daily full, hourly incremental |

### 6.4 Scalability

| Requirement | Target |
|-------------|--------|
| Users per firm | 500+ |
| Concurrent users | 10,000+ |
| Engagements per firm | 10,000+ |
| Storage per engagement | 10 GB+ |

---

## 7. Integration Requirements

### 7.1 Authentication

| Integration | Priority |
|-------------|----------|
| SAML 2.0 SSO | Must |
| OAuth 2.0 | Must |
| Azure AD | Must |
| Okta | Should |
| SCIM provisioning | Should |

### 7.2 Accounting Systems

| Integration | Priority |
|-------------|----------|
| Trial balance import (CSV/Excel) | Must |
| QuickBooks Online | Should |
| Xero | Should |
| Sage | Could |
| SAP | Could |
| Oracle | Could |

### 7.3 Productivity

| Integration | Priority |
|-------------|----------|
| Microsoft 365 (Excel, Word) | Should |
| Google Workspace | Should |
| SharePoint | Could |
| OneDrive | Could |

### 7.4 API

| Feature | Priority |
|---------|----------|
| REST API for data access | Must |
| Webhooks for events | Should |
| API rate limiting | Must |
| API key management | Must |

---

## 8. Implementation Priority

### 8.1 Phase 1: Core Audit Execution (Months 1-4)

**Objective**: Complete one audit engagement using the system

| Module | Features |
|--------|----------|
| Engagement Setup | Create engagement, define team, set materiality |
| Risk Assessment | Risk assessment by account area, approval gate |
| Audit Programs | Create programs, define procedures, assign |
| Procedure Execution | Status workflow, documentation, conclusion |
| Workpapers | Create, edit, version, basic tick marks |
| Evidence | Upload, link to procedures |
| Review | Review notes, sign-off workflow |

**Exit Criteria**:
- Can create engagement from scratch
- Can document risk assessment
- Can execute procedures and document work
- Can create and version workpapers
- Can upload and link evidence
- Multi-level review and sign-off works
- Audit trail captures all changes

### 8.2 Phase 2: Audit Quality (Months 5-7)

**Objective**: Match quality requirements of professional audit firms

| Module | Features |
|--------|----------|
| Workpapers | Full tick mark system, cross-referencing |
| Sampling | MUS calculator, attributes sampling, documentation |
| Findings | Finding documentation, adjustment tracking, SAM |
| Analytical | Planning analytics, substantive analytics |
| Confirmations | Confirmation tracker, status workflow |
| Reporting | Internal status reports, findings summary |

### 8.3 Phase 3: Enterprise Features (Months 8-10)

**Objective**: Ready for enterprise deployment

| Module | Features |
|--------|----------|
| Integration | SSO/SAML, trial balance import |
| Templates | Program library, workpaper templates |
| Reporting | Audit report generation, PDF export |
| Administration | User management, firm settings, audit trail reports |
| Compliance | Data retention, legal hold, export |

### 8.4 Phase 4: Advanced Features (Months 11-12)

| Module | Features |
|--------|----------|
| AI/ML | Risk-based procedure recommendations |
| Integration | Accounting system connectors |
| Analytics | Engagement analytics, firm-wide dashboards |
| Mobile | Mobile evidence capture (tablet) |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Assertion | Statement by management about a class of transactions, account balance, or disclosure |
| Audit Evidence | Information used by the auditor in arriving at conclusions on which the audit opinion is based |
| Combined Risk | Product of inherent risk and control risk |
| Control Risk | Risk that a misstatement will not be prevented or detected by internal controls |
| Inherent Risk | Susceptibility of an assertion to misstatement before considering controls |
| Materiality | Amount of misstatement that would influence a reasonable user |
| MUS | Monetary Unit Sampling - statistical sampling based on dollar amounts |
| Performance Materiality | Amount set below overall materiality to reduce sampling risk |
| Tick Mark | Symbol placed next to an item in a workpaper indicating procedure performed |
| Workpaper | Documentation of audit procedures performed and conclusions reached |

---

## Appendix B: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | Obsidian Engineering | Initial specification |

---

*End of Specification Document*
