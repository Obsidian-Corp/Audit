# Obsidian Audit - Business Logic Specifications

## Document Purpose
This specification defines the required business logic, workflow enforcement, and UI implementation gaps that must be addressed to make Obsidian Audit production-ready for enterprise audit firms.

**Assessment Date:** December 14, 2024
**Current Status:** 10-15% Production Ready
**Target Status:** 100% Production Ready
**Estimated Effort:** 3,000-4,000 development hours

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Gap Analysis by Module](#3-gap-analysis-by-module)
4. [Implementation Specifications](#4-implementation-specifications)
5. [Workflow State Machines](#5-workflow-state-machines)
6. [Priority Implementation Order](#6-priority-implementation-order)
7. [Acceptance Criteria](#7-acceptance-criteria)

---

## 1. Executive Summary

### Core Problem
The platform has comprehensive database schemas (44+ professional standards tables) but lacks:
- Workflow enforcement (state machines)
- UI components for critical audit functions
- Business logic connecting schemas to user interfaces
- Quality gates preventing non-compliant actions

### Impact
- Auditors cannot complete a full audit cycle
- Professional standards (AU-C, ISA, PCAOB) are not enforced
- No audit trail for regulatory inspection
- System provides no value over manual spreadsheets

### Solution
Implement end-to-end workflows with:
1. **State machines** enforcing professional standards
2. **UI components** for all audit phases
3. **Business logic** for calculations and validations
4. **Quality gates** preventing non-compliant progression

---

## 2. Current State Analysis

### What Exists (Infrastructure)

| Component | Database | Hooks | UI | Logic | Status |
|-----------|----------|-------|-----|-------|--------|
| Workpaper Versioning | ✅ | ✅ | ⚠️ | ❌ | 40% |
| Sign-off Records | ✅ | ✅ | ⚠️ | ❌ | 30% |
| Tick Marks | ✅ | ✅ | ❌ | ❌ | 20% |
| Evidence Access Log | ✅ | ✅ | ❌ | ❌ | 20% |
| Independence Declarations | ✅ | ✅ | ❌ | ❌ | 20% |
| Client Risk Assessment | ✅ | ✅ | ❌ | ❌ | 20% |
| Engagement Letters | ✅ | ✅ | ❌ | ❌ | 20% |
| Internal Controls | ✅ | ✅ | ❌ | ❌ | 20% |
| Control Walkthroughs | ✅ | ✅ | ❌ | ❌ | 20% |
| Control Test Results | ✅ | ✅ | ❌ | ❌ | 20% |
| Control Deficiencies | ✅ | ✅ | ❌ | ❌ | 20% |
| EQCR Reviews | ✅ | ✅ | ❌ | ❌ | 20% |
| Going Concern | ✅ | ✅ | ❌ | ❌ | 20% |
| Related Parties | ✅ | ✅ | ❌ | ❌ | 20% |
| Specialists | ✅ | ✅ | ❌ | ❌ | 20% |
| Group Audits | ✅ | ✅ | ❌ | ❌ | 20% |
| Accounting Estimates | ✅ | ✅ | ❌ | ❌ | 20% |
| Litigation & Claims | ✅ | ✅ | ❌ | ❌ | 20% |
| Audit Opinions | ✅ | ✅ | ❌ | ❌ | 20% |
| Key Audit Matters | ✅ | ✅ | ❌ | ❌ | 20% |
| Management Representations | ✅ | ✅ | ❌ | ❌ | 20% |
| TCWG Communications | ✅ | ✅ | ❌ | ❌ | 20% |
| Report Generation | ✅ | ✅ | ❌ | ❌ | 20% |

### What's Partially Working

| Component | Status | Notes |
|-----------|--------|-------|
| Materiality Calculator | 70% | Calculations work, no approval workflow |
| Risk Assessment | 60% | Basic UI exists, no logic connection |
| Procedure Library | 50% | Display works, no execution tracking |
| Findings Management | 50% | Basic CRUD, no materiality gates |
| Workpaper Editor | 40% | Rich text works, no versioning/sign-off |

---

## 3. Gap Analysis by Module

### 3.1 Workflow Engine (CRITICAL - Priority 1)

**Current State:** No workflow enforcement exists
**Required:** State machine preventing non-compliant actions

**Gaps:**
- [ ] Engagement lifecycle state machine
- [ ] Procedure status transitions with validation
- [ ] Sign-off hierarchy enforcement
- [ ] Quality gate checkpoints
- [ ] Blocking rules for missing prerequisites

**Standards Reference:** AU-C 300 (Planning), ISQM 1 (Quality Management)

---

### 3.2 Engagement Acceptance Module (Priority 2)

**Current State:** Database tables exist, no UI or logic
**Required:** Complete acceptance workflow with gates

**Gaps:**
- [ ] Independence declaration form with electronic signature
- [ ] Independence verification before team assignment
- [ ] Client risk assessment wizard
- [ ] Risk scoring algorithm
- [ ] Predecessor auditor communication tracker
- [ ] Engagement letter generator
- [ ] Partner approval workflow
- [ ] AML/KYC checklist
- [ ] Acceptance decision documentation

**Standards Reference:** AU-C 210, AU-C 220, ISQM 1

**Business Rules:**
```
IF client_risk_level = 'unacceptable' THEN
  BLOCK engagement_creation
  REQUIRE partner_override WITH documented_rationale

IF any_team_member.independence = false THEN
  BLOCK team_assignment
  REQUIRE replacement OR safeguard_documentation

IF predecessor_communication.not_complete THEN
  BLOCK acceptance_decision
  SHOW warning "AU-C 210.10 requires predecessor communication"
```

---

### 3.3 Planning Module (Priority 3)

**Current State:** Materiality calculator exists, risk assessment partial
**Required:** Integrated planning with workflow gates

**Gaps:**
- [ ] Materiality approval workflow (manager → partner)
- [ ] Risk assessment connected to procedure recommendations
- [ ] Audit strategy documentation
- [ ] Planning memo generator
- [ ] Resource allocation based on risk
- [ ] Timeline/milestone tracking
- [ ] Scoping decisions documentation

**Standards Reference:** AU-C 300, AU-C 315, AU-C 320

**Business Rules:**
```
IF materiality.not_approved_by_partner THEN
  BLOCK fieldwork_start

IF risk_assessment.not_complete THEN
  BLOCK procedure_assignment

REQUIRE overall_audit_strategy BEFORE detailed_audit_plan
```

---

### 3.4 Control Testing Module (Priority 4)

**Current State:** Tables exist, zero UI implementation
**Required:** Complete TOC/TOD workflow

**Gaps:**
- [ ] Control identification form
- [ ] Control walkthrough documentation
- [ ] Test of controls (TOC) execution
- [ ] Sample selection integration
- [ ] Deviation tracking
- [ ] Deficiency classification logic (MW vs SD vs Deficiency)
- [ ] Compensating controls documentation
- [ ] Management letter generation

**Standards Reference:** AU-C 315, AU-C 330, AU-C 265

**Business Rules:**
```
DEFICIENCY_CLASSIFICATION:
  IF likelihood = 'probable' AND magnitude = 'material' THEN
    classification = 'material_weakness'
  ELSE IF likelihood = 'reasonably_possible' AND magnitude = 'more_than_inconsequential' THEN
    classification = 'significant_deficiency'
  ELSE
    classification = 'control_deficiency'

IF control.key_control = true AND test_result = 'not_effective' THEN
  REQUIRE expanded_substantive_testing
  FLAG for_partner_attention
```

---

### 3.5 Substantive Testing Module (Priority 5)

**Current State:** Procedure library exists, no execution tracking
**Required:** Complete substantive procedure workflow

**Gaps:**
- [ ] Procedure execution workspace
- [ ] Evidence attachment with assertions
- [ ] Sample selection and evaluation
- [ ] Exception tracking
- [ ] Conclusion documentation
- [ ] Cross-reference to workpapers
- [ ] Review notes system
- [ ] Procedure sign-off workflow

**Standards Reference:** AU-C 330, AU-C 500, AU-C 530

**Business Rules:**
```
PROCEDURE_COMPLETION_REQUIREMENTS:
  - conclusion IS NOT NULL
  - evidence_count >= 1
  - preparer_signoff = true
  - reviewer_signoff = true (if procedure.risk_level >= 'high')

IF exceptions_noted = true THEN
  REQUIRE exception_resolution OR finding_creation
```

---

### 3.6 Going Concern Module (Priority 6)

**Current State:** Table exists, zero UI
**Required:** Complete AU-C 570 workflow

**Gaps:**
- [ ] Going concern indicator checklist
- [ ] Management plan evaluation form
- [ ] Cash flow analysis tools
- [ ] Doubt classification logic
- [ ] Disclosure adequacy assessment
- [ ] Report modification determination
- [ ] Going concern conclusion documentation

**Standards Reference:** AU-C 570

**Business Rules:**
```
IF substantial_doubt_exists = true THEN
  IF management_plans_mitigate = true THEN
    conclusion = 'substantial_doubt_mitigated'
    REQUIRE emphasis_of_matter_paragraph
  ELSE
    conclusion = 'substantial_doubt_unmitigated'
    REQUIRE going_concern_opinion_paragraph
    IF disclosure_inadequate THEN
      opinion_type = 'qualified' OR 'adverse'
```

---

### 3.7 Related Parties Module (Priority 7)

**Current State:** Tables exist, zero UI
**Required:** Complete AU-C 550 workflow

**Gaps:**
- [ ] Related party identification form
- [ ] Transaction logging
- [ ] Arms-length evaluation
- [ ] Fraud risk indicators
- [ ] Disclosure completeness check
- [ ] Board approval tracking

**Standards Reference:** AU-C 550

**Business Rules:**
```
IF transaction.outside_normal_business = true THEN
  FLAG for_fraud_consideration
  REQUIRE business_rationale_documentation

IF related_party.previously_undisclosed = true THEN
  REQUIRE management_inquiry_documentation
  FLAG for_partner_attention
```

---

### 3.8 Specialists & Experts Module (Priority 8)

**Current State:** Tables exist, zero UI
**Required:** AU-C 620 workflow

**Gaps:**
- [ ] Specialist engagement form
- [ ] Competence evaluation checklist
- [ ] Objectivity assessment
- [ ] Work adequacy evaluation
- [ ] Conclusion consistency check
- [ ] Report reference determination

**Standards Reference:** AU-C 620, AU-C 500

---

### 3.9 Group Audits Module (Priority 9)

**Current State:** Tables exist, zero UI
**Required:** AU-C 600 workflow

**Gaps:**
- [ ] Component identification
- [ ] Component auditor evaluation
- [ ] Group instructions generator
- [ ] Materiality allocation
- [ ] Work review documentation
- [ ] Consolidation procedures

**Standards Reference:** AU-C 600

---

### 3.10 Accounting Estimates Module (Priority 10)

**Current State:** Tables exist, zero UI
**Required:** AU-C 540 workflow

**Gaps:**
- [ ] Estimate identification
- [ ] Risk classification
- [ ] Method/assumption evaluation
- [ ] Point estimate vs range
- [ ] Retrospective review
- [ ] Management bias indicators

**Standards Reference:** AU-C 540

---

### 3.11 Litigation & Claims Module (Priority 11)

**Current State:** Tables exist, zero UI
**Required:** AU-C 501 workflow

**Gaps:**
- [ ] Litigation register
- [ ] Attorney letter generator
- [ ] Response tracking
- [ ] Classification (probable/possible/remote)
- [ ] Accrual/disclosure determination

**Standards Reference:** AU-C 501

---

### 3.12 Subsequent Events Module (Priority 12)

**Current State:** Basic table exists
**Required:** AU-C 560 workflow

**Gaps:**
- [ ] Event identification form
- [ ] Type I vs Type II classification
- [ ] Adjustment/disclosure determination
- [ ] Dual-dating logic
- [ ] Management representation update

**Standards Reference:** AU-C 560

---

### 3.13 Quality Control Module (Priority 13)

**Current State:** EQCR tables exist, zero UI
**Required:** Complete ISQM 2 workflow

**Gaps:**
- [ ] EQCR assignment
- [ ] Review checklist
- [ ] Issue tracking
- [ ] Concurring approval
- [ ] Consultation documentation
- [ ] Hot review capability

**Standards Reference:** ISQM 1, ISQM 2

---

### 3.14 Audit Reporting Module (Priority 14)

**Current State:** Tables exist, zero UI or logic
**Required:** Complete AU-C 700-706 workflow

**Gaps:**
- [ ] Opinion type determination logic
- [ ] Basis for opinion generator
- [ ] KAM identification and drafting
- [ ] EOM/OM paragraph drafting
- [ ] Management responsibilities section
- [ ] Auditor responsibilities section
- [ ] Report assembly engine
- [ ] Report versioning
- [ ] Issuance checklist
- [ ] Partner sign-off

**Standards Reference:** AU-C 700, AU-C 701, AU-C 705, AU-C 706

**Business Rules:**
```
OPINION_DETERMINATION:
  IF uncorrected_misstatements > planning_materiality THEN
    IF pervasive = true THEN
      opinion = 'adverse'
    ELSE
      opinion = 'qualified'
  ELSE IF scope_limitation EXISTS THEN
    IF pervasive = true THEN
      opinion = 'disclaimer'
    ELSE
      opinion = 'qualified'
  ELSE
    opinion = 'unmodified'

REPORT_ISSUANCE_BLOCKERS:
  - management_representation_letter.received = false
  - subsequent_events_review.complete = false
  - going_concern_assessment.complete = false
  - partner_signoff.complete = false
  - eqcr_approval.complete = false (if required)
```

---

### 3.15 Management Representations Module (Priority 15)

**Current State:** Tables exist, zero UI
**Required:** AU-C 580 workflow

**Gaps:**
- [ ] Representation letter generator
- [ ] Standard representations checklist
- [ ] Engagement-specific representations
- [ ] Signature tracking
- [ ] Receipt confirmation

**Standards Reference:** AU-C 580

---

### 3.16 TCWG Communications Module (Priority 16)

**Current State:** Tables exist, zero UI
**Required:** AU-C 260/265 workflow

**Gaps:**
- [ ] Communication log
- [ ] Required matters checklist
- [ ] Letter generator
- [ ] Response tracking
- [ ] Control deficiency letter (AU-C 265)

**Standards Reference:** AU-C 260, AU-C 265

---

## 4. Implementation Specifications

### 4.1 Architecture Requirements

```
src/
├── components/
│   └── professional-standards/
│       ├── acceptance/           # Engagement acceptance
│       ├── planning/             # Planning phase
│       ├── controls/             # Control testing
│       ├── substantive/          # Substantive procedures
│       ├── going-concern/        # Going concern
│       ├── related-parties/      # Related parties
│       ├── specialists/          # Specialists/experts
│       ├── group-audit/          # Group audits
│       ├── estimates/            # Accounting estimates
│       ├── litigation/           # Litigation & claims
│       ├── subsequent-events/    # Subsequent events
│       ├── quality-control/      # EQCR & QC
│       ├── reporting/            # Audit reporting
│       ├── representations/      # Management reps
│       └── tcwg/                 # TCWG communications
├── lib/
│   ├── state-machines/           # Workflow state machines
│   │   ├── engagement-lifecycle.ts
│   │   ├── procedure-status.ts
│   │   └── review-workflow.ts
│   └── business-logic/           # Business rules
│       ├── opinion-determination.ts
│       ├── deficiency-classification.ts
│       ├── materiality-gates.ts
│       └── risk-calculations.ts
└── hooks/
    └── useProfessionalStandards.ts  # Already exists - CONNECT TO UI
```

### 4.2 State Machine Definitions

```typescript
// Engagement Lifecycle States
type EngagementState =
  | 'draft'
  | 'acceptance_pending'
  | 'accepted'
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'issued'
  | 'archived';

// Valid Transitions
const ENGAGEMENT_TRANSITIONS = {
  draft: ['acceptance_pending'],
  acceptance_pending: ['accepted', 'draft'],  // Can reject back to draft
  accepted: ['planning'],
  planning: ['fieldwork'],
  fieldwork: ['review'],
  review: ['fieldwork', 'reporting'],  // Can go back for more work
  reporting: ['review', 'issued'],
  issued: ['archived'],
  archived: [],
};

// Transition Requirements
const TRANSITION_REQUIREMENTS = {
  'draft→acceptance_pending': [
    'client_risk_assessment.complete',
    'independence_declarations.all_complete',
  ],
  'acceptance_pending→accepted': [
    'partner_approval.granted',
    'engagement_letter.signed',
  ],
  'accepted→planning': [
    'team_assigned',
  ],
  'planning→fieldwork': [
    'materiality.approved',
    'risk_assessment.complete',
    'audit_strategy.documented',
  ],
  'fieldwork→review': [
    'all_procedures.complete',
    'all_findings.documented',
  ],
  'review→reporting': [
    'partner_review.complete',
    'eqcr.complete', // if required
    'going_concern.assessed',
    'subsequent_events.reviewed',
  ],
  'reporting→issued': [
    'opinion.determined',
    'report.approved',
    'management_rep.received',
    'partner_signoff.complete',
  ],
};
```

---

## 5. Workflow State Machines

### 5.1 Procedure Status State Machine

```
                    ┌──────────────┐
                    │  not_started │
                    └──────┬───────┘
                           │ assign
                           ▼
                    ┌──────────────┐
              ┌─────│  in_progress │◄────────┐
              │     └──────┬───────┘         │
              │            │ submit          │ revision_requested
              │            ▼                 │
              │     ┌──────────────┐         │
              │     │ pending_review├────────┘
              │     └──────┬───────┘
              │            │ approve
              │            ▼
              │     ┌──────────────┐
              │     │   complete   │
              │     └──────┬───────┘
              │            │ signoff
              │            ▼
              │     ┌──────────────┐
              └────►│  signed_off  │
                    └──────────────┘
```

### 5.2 Sign-off Hierarchy

```
Preparer → Reviewer → Senior Reviewer → Manager → Partner
    │          │            │              │          │
    └──────────┴────────────┴──────────────┴──────────┘
              Each level must sign before next can sign
```

### 5.3 Finding Resolution Workflow

```
Open → Under Review → Management Response → Remediation → Resolved
  │                         │                              │
  └─────────────────────────┴──────────────────────────────┘
                    Can escalate at any point
```

---

## 6. Priority Implementation Order

### Phase 1: Core Infrastructure (Weeks 1-4)
1. **Workflow Engine** - State machines for engagement lifecycle
2. **Sign-off System** - Hierarchy enforcement with content hashing
3. **Quality Gates** - Blocking rules for non-compliant actions

### Phase 2: Engagement Acceptance (Weeks 5-8)
4. **Independence Module** - Declarations with verification
5. **Client Risk Assessment** - Scoring and approval workflow
6. **Engagement Letters** - Generation and signature tracking

### Phase 3: Planning (Weeks 9-12)
7. **Materiality Workflow** - Approval gates
8. **Risk Assessment Integration** - Connect to procedures
9. **Audit Strategy** - Documentation templates

### Phase 4: Fieldwork (Weeks 13-20)
10. **Control Testing** - Walkthroughs, TOC, deficiency classification
11. **Substantive Procedures** - Execution workspace
12. **Evidence Management** - Linking to assertions

### Phase 5: Specialized Areas (Weeks 21-28)
13. **Going Concern** - Full AU-C 570 workflow
14. **Related Parties** - AU-C 550 workflow
15. **Specialists** - AU-C 620 workflow
16. **Estimates** - AU-C 540 workflow
17. **Litigation** - AU-C 501 workflow

### Phase 6: Completion (Weeks 29-36)
18. **EQCR** - Quality control review
19. **Management Representations** - Letter generation
20. **TCWG Communications** - Required communications
21. **Subsequent Events** - AU-C 560 workflow

### Phase 7: Reporting (Weeks 37-44)
22. **Opinion Determination** - Logic engine
23. **Report Generation** - Assembly with KAMs, EOM, OM
24. **Issuance Workflow** - Final checklist and sign-off

### Phase 8: Testing & Validation (Weeks 45-48)
25. **End-to-End Testing** - Full audit cycle validation
26. **User Acceptance Testing** - With actual auditors
27. **Performance Optimization** - Load testing
28. **Documentation** - User guides

---

## 7. Acceptance Criteria

### Module Acceptance Criteria Template

Each module must satisfy:

1. **Functional Requirements**
   - [ ] All CRUD operations work
   - [ ] Workflow states enforced
   - [ ] Business rules validated
   - [ ] Calculations accurate

2. **Professional Standards Compliance**
   - [ ] AU-C/ISA requirements met
   - [ ] Documentation sufficient for peer review
   - [ ] Audit trail complete

3. **Quality Gates**
   - [ ] Cannot skip required steps
   - [ ] Proper authorization enforced
   - [ ] Sign-off hierarchy respected

4. **Integration**
   - [ ] Connected to engagement workflow
   - [ ] Cross-references work
   - [ ] Evidence linking functional

5. **Testing**
   - [ ] Unit tests pass (>80% coverage)
   - [ ] Integration tests pass
   - [ ] E2E workflow tests pass

---

## Appendix A: Database Tables Reference

### Phase 1 Tables (Workflow & Documentation)
- workpaper_versions
- signoff_records
- tick_mark_definitions
- tick_mark_usages
- workpaper_cross_references
- evidence_access_log
- procedure_status_transitions
- procedure_status_history
- immutable_audit_log

### Phase 2 Tables (Independence & Acceptance)
- independence_declarations
- conflict_of_interest_register
- client_risk_assessments
- engagement_letters
- predecessor_communications
- client_aml_records
- engagement_acceptance_checklists

### Phase 3 Tables (Controls & Quality)
- internal_controls
- control_walkthroughs
- control_test_results
- control_deficiencies
- eqcr_reviews
- consultation_records
- going_concern_assessments
- related_parties
- related_party_transactions

### Phase 4 Tables (Specialized Areas)
- specialist_engagements
- group_audit_components
- group_instructions
- accounting_estimates
- litigation_claims
- attorney_letters
- subsequent_events

### Phase 5 Tables (Reporting)
- audit_opinions
- key_audit_matters
- emphasis_of_matters
- other_matter_paragraphs
- management_representations
- representation_items
- tcwg_communications
- control_deficiency_communications
- audit_report_templates
- audit_reports
- audit_report_history
- report_issuance_checklists

---

## Appendix B: Standards Reference

| Standard | Title | Relevant Modules |
|----------|-------|------------------|
| AU-C 210 | Terms of Engagement | Acceptance |
| AU-C 220 | Quality Control | EQCR, All |
| AU-C 230 | Documentation | All |
| AU-C 240 | Fraud | Risk, Procedures |
| AU-C 260 | TCWG Communications | TCWG |
| AU-C 265 | Control Deficiencies | Controls, TCWG |
| AU-C 300 | Planning | Planning |
| AU-C 315 | Risk Assessment | Risk, Controls |
| AU-C 320 | Materiality | Planning |
| AU-C 330 | Responses to Risk | Controls, Procedures |
| AU-C 450 | Misstatements | Findings |
| AU-C 500 | Audit Evidence | Procedures |
| AU-C 501 | Specific Items | Litigation |
| AU-C 505 | Confirmations | Procedures |
| AU-C 520 | Analytical Procedures | Procedures |
| AU-C 530 | Sampling | Procedures |
| AU-C 540 | Estimates | Estimates |
| AU-C 550 | Related Parties | Related Parties |
| AU-C 560 | Subsequent Events | Subsequent Events |
| AU-C 570 | Going Concern | Going Concern |
| AU-C 580 | Representations | Representations |
| AU-C 600 | Group Audits | Group Audits |
| AU-C 620 | Specialists | Specialists |
| AU-C 700 | Opinion | Reporting |
| AU-C 701 | KAMs | Reporting |
| AU-C 705 | Modifications | Reporting |
| AU-C 706 | EOM/OM | Reporting |
| ISQM 1 | Quality Management | All |
| ISQM 2 | Engagement Reviews | EQCR |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-14 | Claude | Initial specification |

---

*This document serves as the master specification for implementing enterprise audit functionality in Obsidian Audit. All development should reference this document for requirements and acceptance criteria.*
