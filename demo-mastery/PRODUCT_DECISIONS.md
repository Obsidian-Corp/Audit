# Obsidian Audit: Product Decision Log

## Purpose
This document explains the reasoning behind every major product decision.
Use this to answer "why did you build it this way?" with confidence.

---

## Architecture Decisions

### Decision: Engagement-Centric Navigation
**What we built:** The entire application revolves around engagements. Users navigate through engagements to access workpapers, findings, procedures, and time tracking.

**Why this approach:**
- Auditors think in terms of engagements, not features
- Every piece of audit work exists within an engagement context
- Reduces context-switching between different parts of the system
- Matches the mental model of how audit work is organized

**Alternatives considered:**
- Feature-centric (separate modules for workpapers, findings, etc.) - rejected because it fragments the audit narrative
- Client-centric - rejected because the same client has multiple engagements with different teams

**Audit principle aligned:** ISA 230 (Audit Documentation) - documentation must be organized by engagement

**Benefit to user:** Users always know "where am I" in the context of their work. Everything related to an engagement is accessible from that engagement.

---

### Decision: Multi-Tenant Architecture with Firm-Level Isolation
**What we built:** Complete data isolation at the firm level using Row Level Security (RLS). Each firm sees only their own data.

**Why this approach:**
- Audit firms handle confidential client information
- Regulatory requirements (GDPR, SOC 2) demand data isolation
- Enables secure multi-firm hosting while maintaining data sovereignty
- Simplifies compliance reporting per firm

**Audit principle aligned:**
- ISQM 1 (Quality Management) - confidentiality requirements
- Professional ethics codes requiring client confidentiality

**Benefit to user:** Confidence that client data is completely isolated. No risk of data leakage between firms.

---

### Decision: Role-Based Access Control with 7 Internal Roles
**What we built:** Hierarchical role system: Partner → Manager → Senior → Staff (plus specialists)

**Why this approach:**
- Mirrors actual audit firm hierarchy
- Partners need oversight without daily execution
- Managers need review and approval capabilities
- Staff need execution access without administrative control
- Different roles have different liability and responsibility

**Roles defined:**
| Role | Primary Function | Key Capabilities |
|------|-----------------|------------------|
| Partner | Final authority, sign-off | All access, opinion signing |
| Manager | Engagement leadership | Review, approval, budget |
| Senior Auditor | Lead fieldwork | Execute, review staff work |
| Staff Auditor | Execute procedures | Document, test, evidence |
| IT Specialist | Technical testing | ITGC, security testing |
| Quality Reviewer | Independence | Cross-engagement review |
| Firm Admin | System administration | User management, settings |

**Audit principle aligned:** ISA 220 (Quality Management for Audits) - requires clear assignment of responsibility

**Benefit to user:** Appropriate access for each role. Partners aren't overwhelmed with detail; staff can't accidentally change critical settings.

---

## Navigation & Information Architecture

### Decision: 16-Tab Engagement Detail Structure
**What we built:** Engagement details organized into 16 tabs across 4 workflow phases: Planning, Execution, Tracking, Review

**Why this approach:**
- Audit work follows predictable phases
- Each phase has specific deliverables and concerns
- Tabs allow quick access without page navigation
- Grouping by phase helps users understand workflow progression

**Tab organization:**
```
PLANNING                    EXECUTION
├── Overview                ├── Team
├── Risk Assessment         ├── Workpapers
├── Scope                   ├── Evidence
└── Audit Program           ├── Info Requests
                            ├── Tasks
TRACKING                    ├── Documents
├── Milestones              └── Findings
├── Budget/Time
├── Schedule                REVIEW
└── Calendar                ├── Deliverables
                            ├── Communications
                            └── Change Orders
```

**Audit principle aligned:**
- ISA 300 (Planning) - planning phase requirements
- ISA 330 (Responses to Assessed Risks) - execution requirements
- ISA 450 (Evaluation of Misstatements) - review requirements

**Benefit to user:** Information is where they expect it based on audit phase. No hunting through unrelated features.

---

### Decision: Sidebar Navigation with Collapsible Sections
**What we built:** Fixed sidebar with 7 collapsible sections and real-time badge counts

**Why this approach:**
- Persistent navigation reduces clicks
- Collapsible sections prevent overwhelm
- Badge counts surface actionable items
- Consistent across all pages

**Sections:**
1. Dashboard (fixed)
2. My Work (procedures, tasks, review queue)
3. Engagements (list, templates, approvals)
4. Audit Execution (workpapers, findings, evidence)
5. Tools (materiality, sampling, confirmations, analytics)
6. Planning (universe, risks, plans)
7. Quality (QC dashboard)
8. Admin (users, settings)

**Benefit to user:** Always know what needs attention (badge counts). Never more than 2 clicks from any feature.

---

## Workflow Decisions

### Decision: Review Note as Dialogue, Not Comments
**What we built:** Review notes are structured conversations between preparer and reviewer, preserved permanently

**Why this approach:**
- Traditional comments disappear after resolution
- Review dialogue contains professional judgment reasoning
- Two years later, "why did we accept this approach?" has an answer
- Creates institutional knowledge that survives staff turnover

**Review note lifecycle:**
```
REVIEWER → Creates note (question/issue)
PREPARER → Responds (explanation/action taken)
REVIEWER → Clears note (accepts resolution)
SYSTEM → Preserves entire dialogue forever
```

**Audit principle aligned:**
- ISA 220 (Quality Management) - review requirements
- ISQC 1 - engagement quality control review

**Benefit to user:**
- Reviewers document their thinking, not just approval
- Peer reviewers can see how issues were resolved
- New team members understand historical decisions

---

### Decision: Evidence-Procedure-Conclusion Traceability Chain
**What we built:** Every conclusion links to supporting procedures, which link to underlying evidence. The chain is navigable in both directions.

**Why this approach:**
- Audit opinions rest on chains of evidence
- Peer reviewers need to trace any conclusion to its support
- Regulators increasingly demand this documentation
- "Trust but verify" - anyone can verify any statement

**Traceability model:**
```
CONCLUSION
  ↓
PROCEDURE (what we did)
  ↓
EVIDENCE (what we saw)
  ↓
SOURCE DOCUMENT (where we got it)
```

**Audit principle aligned:** ISA 500 (Audit Evidence) - sufficient appropriate audit evidence requirement

**Benefit to user:**
- Survive any peer review in seconds, not hours
- Instant answer to "what supports this conclusion?"
- Confidence that documentation is complete

---

### Decision: Workpaper Status Workflow
**What we built:** Workpapers progress through defined states: Draft → Ready for Review → In Review → Reviewed → Approved

**Why this approach:**
- Matches how work actually flows in audit teams
- Clear handoffs between preparer and reviewer
- Prevents premature sign-off
- Enables progress tracking

**Status states:**
| Status | Owner | Next Action |
|--------|-------|-------------|
| Draft | Preparer | Complete and submit |
| Ready for Review | System | Wait for reviewer |
| In Review | Reviewer | Add notes or approve |
| Reviewed | Reviewer | Clear notes or escalate |
| Approved | N/A | Complete |

**Audit principle aligned:** ISA 230 (Documentation) - completion requirements

**Benefit to user:**
- Clear expectations at each stage
- No ambiguity about who owns the work item
- Dashboard shows real progress

---

### Decision: Finding Using CCCEE Structure
**What we built:** Findings follow Condition-Criteria-Cause-Effect-Evidence structure

**Why this approach:**
- Industry-standard finding format
- Forces complete documentation
- Ensures findings are actionable
- Consistent quality across all findings

**Finding structure:**
```
CONDITION: What did we find?
CRITERIA: What should it be?
CAUSE: Why did this happen?
EFFECT: What's the impact?
EVIDENCE: How do we know?
```

Plus: Recommendation, Management Response, Severity, Status

**Audit principle aligned:**
- AU-C 265 (Internal Control Deficiencies)
- Government Auditing Standards (Yellow Book)

**Benefit to user:**
- Complete findings every time
- Easier management discussion
- Defensible conclusions

---

## Data Model Decisions

### Decision: Audit Programs as Reusable Templates
**What we built:** Audit programs exist as templates in a library, then are instantiated on each engagement with engagement-specific details.

**Why this approach:**
- Firms have standard audit approaches by industry
- Templates ensure consistency
- Prior year programs accelerate planning
- Updates to templates flow to future engagements

**Model:**
```
PROGRAM TEMPLATE (Library)
  → ENGAGEMENT PROGRAM (Instance)
    → PROCEDURES (Assigned to team)
```

**Audit principle aligned:** ISA 300 (Planning) - use of prior period audit programs

**Benefit to user:**
- Don't reinvent the wheel each engagement
- Firm methodology captured and enforced
- Easy to update approach firm-wide

---

### Decision: Procedures Linked to Risks
**What we built:** Audit procedures explicitly link to identified risks. Risk assessment changes propagate to required procedures.

**Why this approach:**
- Risk-based auditing is the modern standard
- Must demonstrate response to each identified risk
- Changes in risk profile should change audit approach
- Regulators check for risk-response linkage

**Risk-Procedure connection:**
```
IDENTIFIED RISK
  → REQUIRED RESPONSE (procedure)
    → EXECUTION (work performed)
      → CONCLUSION (risk addressed or not)
```

**Audit principle aligned:**
- ISA 315 (Identifying Risks)
- ISA 330 (Responses to Risks)

**Benefit to user:**
- Clear audit trail from risk to response
- No orphan procedures (everything links to a risk)
- Easy to explain "why did we test this?"

---

### Decision: Time Tracking Integrated with Work Items
**What we built:** Time entries link directly to engagements, workpapers, or tasks. No separate timesheet system.

**Why this approach:**
- Auditors hate timesheets
- Time tracked at point of work is more accurate
- Budget monitoring requires work-level granularity
- Billing analysis needs engagement-level detail

**Time model:**
```
TIME ENTRY
  ├── Engagement (always)
  ├── Workpaper (optional)
  └── Task (optional)
```

**Benefit to user:**
- No separate timesheet app
- Time tracked as part of normal workflow
- Accurate budget monitoring
- Easy billing preparation

---

## Feature-Specific Decisions

### Decision: Materiality Calculator with Calculation History
**What we built:** Multiple materiality calculation methods, saved history of all calculations with rationale.

**Why this approach:**
- Different methods for different situations
- Auditors need to document materiality basis
- Peer reviewers question materiality decisions
- Materiality may need revision mid-engagement

**Calculation methods:**
1. Percentage of benchmark (revenue, assets, equity, etc.)
2. Sliding scale (varies by entity size)
3. Prior year plus inflation
4. Custom formula

**Audit principle aligned:** ISA 320 (Materiality in Planning and Performing)

**Benefit to user:**
- Documented, defensible materiality
- Easy to recalculate if circumstances change
- Peer review question answered: "how did you determine materiality?"

---

### Decision: Confirmation Tracking as First-Class Feature
**What we built:** Complete confirmation lifecycle tracking: send → wait → receive → reconcile

**Why this approach:**
- Confirmations are audit evidence gold standard
- Lost confirmations are a significant audit risk
- Tracking exceptions requires careful documentation
- Regulators specifically review confirmation procedures

**Confirmation lifecycle:**
```
DRAFT → SENT → OUTSTANDING → RECEIVED
                    ↓
               ALTERNATIVE PROCEDURES
                    ↓
               RESOLVED (agreed/exception documented)
```

**Audit principle aligned:** ISA 505 (External Confirmations)

**Benefit to user:**
- Nothing falls through cracks
- Clear status on every confirmation
- Alternative procedures documented when needed

---

### Decision: Sampling Calculator with Documentation
**What we built:** Statistical and non-statistical sampling calculators that document methodology and parameters.

**Why this approach:**
- Sampling methodology must be documented
- Parameters affect conclusion reliability
- Peer reviewers challenge sample sizes
- Consistency across engagement team

**Supported methods:**
- Attribute sampling (controls testing)
- Variables sampling (substantive testing)
- Monetary unit sampling (high-value items)
- Non-statistical (risk-based)

**Audit principle aligned:** ISA 530 (Audit Sampling)

**Benefit to user:**
- Defensible sample sizes
- Documented methodology
- Consistent approach across team

---

### Decision: Information Request Tracking
**What we built:** Formal PBC (Prepared By Client) request system with due dates, status tracking, and follow-up.

**Why this approach:**
- Client document requests often get lost
- Follow-up on overdue items wastes time
- Need audit trail of what was requested and when
- Client responsiveness affects timeline

**Request lifecycle:**
```
REQUESTED → PENDING → RECEIVED → REVIEWED
     ↓
  OVERDUE → FOLLOW-UP SENT
```

**Benefit to user:**
- Nothing falls through cracks
- Automated overdue tracking
- Clear client communication record
- Timeline impact visible

---

## Security Decisions

### Decision: Row-Level Security for All Client Data
**What we built:** Every query filters by firm_id at the database level. No application-level trust.

**Why this approach:**
- Defense in depth
- Application bugs can't leak data
- Auditable at database level
- Required for SOC 2 compliance

**Benefit to user:** Peace of mind that client confidentiality is enforced by infrastructure, not just application code.

---

### Decision: Audit Logging of All Significant Actions
**What we built:** Comprehensive audit log of who did what, when, to which record.

**Why this approach:**
- Regulatory requirement (SOC 2, GDPR)
- Internal investigation capability
- Demonstrates custody of records
- Required for insurance and liability

**Logged actions:**
- Authentication events
- Data creation/modification/deletion
- Status changes
- Access to sensitive records
- Export/download events

**Benefit to user:** Can demonstrate who did what and when. Essential for client trust and regulatory compliance.

---

## Philosophy: Why Obsidian Audit Exists

### The Core Insight
**Audit is an epistemological exercise.** The auditor's job is to build justified belief - confidence that the financial statements are fairly stated. Everything in the product serves this goal.

### What Makes Us Different

1. **Traceability is architecture, not metadata.** The link from conclusion to evidence isn't a cross-reference you hope someone maintains. It's the data model.

2. **Review is reasoning, not approval.** The dialogue between preparer and reviewer is institutional knowledge, preserved forever.

3. **Status is truth, not opinion.** When the dashboard says 65% complete, that's calculated from actual work status, not what someone remembered to update.

4. **Integration is native, not bolted on.** Time tracking, evidence management, and workpapers are one system, not three systems connected by hope.

### When Explaining to Prospects

**Don't say:** "We have features X, Y, Z"
**Say:** "We built this because auditors deserve a tool that reflects the rigor of their profession"

**Don't say:** "Look at this dashboard"
**Say:** "When a peer reviewer asks 'what supports this conclusion,' the answer is one click away"

**Don't say:** "We integrate time tracking"
**Say:** "Your team never opens a separate timesheet app again"

---

## Quick Reference: Product Decision FAQ

| Question | Answer |
|----------|--------|
| Why engagement-centric? | Auditors think in engagements, not features |
| Why preserve review notes? | Institutional knowledge survives turnover |
| Why link procedures to risks? | Risk-based auditing is the standard |
| Why integrated time? | Hate timesheets → track at point of work |
| Why CCCEE findings? | Industry standard, forces completeness |
| Why materiality history? | Peer reviewers ask "how did you determine this?" |
| Why confirmation tracking? | Lost confirmations = audit failure |
| Why role-based access? | Matches firm hierarchy and liability |

---

*This document should be updated as new product decisions are made.*
