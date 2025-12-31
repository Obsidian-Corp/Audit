# Obsidian Audit: Product Decision Log

## Purpose
This document explains the reasoning behind every major product decision.
Use this to answer "why did you build it this way?" with confidence.

---

## Architecture Decisions

### Decision: Multi-Tenant Architecture with Firm Isolation

**What we built:** Each audit firm is a completely isolated tenant with its own data, users, and configurations. Row-Level Security (RLS) enforces data isolation at the database level.

**Why this approach:**
- Audit firms handle extremely sensitive client data
- Regulatory requirements (SOC 2, GDPR) demand data isolation
- Each firm has unique workflows and configurations
- Prevents any possibility of cross-firm data leakage

**Alternatives considered:**
- Single-tenant deployments: Higher ops cost, slower updates
- Schema-per-tenant: Complex migrations, limited scale

**Audit principle aligned:** ISA 220 (Quality Control) - confidentiality requirements

**Benefit to user:** Partners can confidently tell clients their data is cryptographically isolated from other firms.

---

### Decision: Engagement-Centric Information Architecture

**What we built:** The entire application is organized around "engagements" as the primary entity. Navigation, data, and workflows all flow through the engagement context.

**Why this approach:**
- Auditors think in terms of engagements, not features
- Reduces context-switching between clients/engagements
- Matches mental model of audit work
- Supports the natural hierarchy: Firm → Client → Engagement → Workpapers

**Alternatives considered:**
- Feature-centric (workpapers module, findings module): Loses context
- Client-centric: Many clients have multiple concurrent engagements

**Audit principle aligned:** ISA 230 (Audit Documentation) - engagement file requirements

**Benefit to user:** Users always know "where am I" in the context of their work. Everything connects back to the engagement.

---

### Decision: Real-Time Status from Actual Data

**What we built:** Engagement progress, procedure status, and review status are calculated from actual workpaper and task states, not manually updated.

**Why this approach:**
- Manual status updates get stale immediately
- Time pressure makes status tracking the first thing to slip
- Partners hate surprises on engagement status
- Truth emerges from the work, not from what someone remembered to update

**Alternatives considered:**
- Manual status fields: Easy to implement, always wrong
- Scheduled batch calculations: Stale by design

**Audit principle aligned:** ISQM 1 (Quality Management) - monitoring requirements

**Benefit to user:** When the partner asks "are we on track," the answer is always current and accurate.

---

## Workflow Decisions

### Decision: Structured Review Note Workflow

**What we built:** Review notes are attached to workpapers with a dialogue structure: preparer response → reviewer follow-up → resolution. The full conversation is preserved permanently.

**Why this approach:**
- Review dialogue is institutional knowledge
- Current tools: notes in email, lost after resolution
- Peer reviewers need to understand past review decisions
- Two years later, "why did we conclude this?" has an answer

**Alternatives considered:**
- Simple comments: No workflow, no tracking
- Email-based review: Already exists, doesn't work

**Audit principle aligned:** ISA 220 (Quality Control for Audits) - direction, supervision, review

**Benefit to user:** Review history becomes searchable institutional memory. New managers can understand prior decisions.

---

### Decision: Preparer → Reviewer → Approver Signoff Chain

**What we built:** Workpapers require explicit signoffs at three levels: preparer completion, reviewer approval, and final approver signoff. Each level can only be signed after the previous.

**Why this approach:**
- Mirrors GAAS review requirements exactly
- Creates clear accountability at each level
- Provides audit trail for peer review
- Prevents "rubber stamp" approvals

**Alternatives considered:**
- Single approval: Doesn't meet professional standards
- Flexible workflow: Too easy to skip steps

**Audit principle aligned:** AU-C 220 (Quality Control for Engagements)

**Benefit to user:** Peer reviewers can instantly verify proper review occurred. Defensible audit file.

---

### Decision: Condition-Criteria-Cause-Effect Finding Structure

**What we built:** Findings require structured documentation: Condition (what we found), Criteria (what it should be), Cause (why it happened), Effect (what's the impact), and Recommendation.

**Why this approach:**
- This is the professional standard for audit findings
- Structured data enables analytics and trending
- Forces complete documentation at creation
- Management responses address the right elements

**Alternatives considered:**
- Free-form text: Hard to analyze, inconsistent quality
- Simplified structure: Wouldn't meet peer review requirements

**Audit principle aligned:** AU-C 265 (Communicating Deficiencies)

**Benefit to user:** Findings are automatically structured for management letters and board communications.

---

## Navigation & UX Decisions

### Decision: Collapsible Section-Based Sidebar

**What we built:** Navigation is organized into collapsible sections (My Work, Engagements, Audit Execution, Tools, etc.) that expand/collapse with state persistence.

**Why this approach:**
- Audit software has many features, needs organization
- Role-based filtering reduces clutter for junior staff
- Collapsed sections reduce cognitive load
- Users can customize their view

**Alternatives considered:**
- Flat navigation: Overwhelming with 40+ items
- Dropdown menus: Requires more clicks

**Audit principle aligned:** N/A (UX best practice)

**Benefit to user:** Staff see their tasks; managers see review queue; partners see oversight. Same app, role-appropriate view.

---

### Decision: Badge Counts for Action Items

**What we built:** Navigation items show badge counts for items requiring attention (assigned procedures, review items, pending approvals, open findings).

**Why this approach:**
- Auditors need to know what requires their attention
- Reduces need to check multiple screens
- Creates urgency for items requiring action
- Visual indicator of workload

**Alternatives considered:**
- No badges: Users miss time-sensitive items
- Dashboard-only counts: Requires extra navigation

**Audit principle aligned:** ISQM 1 - monitoring and remediation

**Benefit to user:** Never miss an item requiring attention. Instant visibility into workload.

---

## Feature-Specific Decisions

### Decision: Materiality Calculator with AU-C 320 Compliance

**What we built:** Full materiality calculator supporting multiple benchmarks, industry guidance, performance materiality, clearly trivial threshold, with calculation history and approval workflow.

**Why this approach:**
- Materiality is foundational to every audit
- Current tools: Excel spreadsheets, inconsistent approaches
- Need to document rationale for benchmark selection
- Peer reviewers question materiality decisions

**Alternatives considered:**
- Simple calculator: Wouldn't document judgment
- Embedded in engagement setup: Users need standalone tool

**Audit principle aligned:** AU-C 320 (Materiality in Planning and Performing an Audit)

**Benefit to user:** Defensible materiality with documented rationale. History shows how materiality evolved.

---

### Decision: Confirmation Tracker with Full Lifecycle

**What we built:** Complete confirmation management: bank, AR, legal, other. Tracks sent date, reminders, responses, exceptions, alternative procedures, and resolution.

**Why this approach:**
- Confirmations are manual, error-prone process
- Tracking happens in spreadsheets, easy to lose items
- Alternative procedures must be documented
- Timing differences require careful tracking

**Alternatives considered:**
- External confirmation service integration: Future enhancement
- Simple checklist: Doesn't capture the complexity

**Audit principle aligned:** AU-C 505 (External Confirmations)

**Benefit to user:** Never lose a confirmation. Full audit trail of confirmation process.

---

### Decision: Evidence-Procedure-Conclusion Traceability

**What we built:** Every workpaper conclusion can be traced to the evidence that supports it and the procedure that generated it. Navigation between these is one-click.

**Why this approach:**
- Audit opinions rest on chains of evidence
- Peer reviewers need to trace any conclusion to its support
- Regulators increasingly demand documentation traceability
- This is the fundamental principle of audit documentation

**Alternatives considered:**
- Document references only: Requires manual lookup
- Folder structure: Relationships implicit, not explicit

**Audit principle aligned:** ISA 500 (Audit Evidence) - sufficient appropriate evidence

**Benefit to user:** Survive any peer review. Instant answer to "what supports this?"

---

### Decision: Sampling Calculator with Statistical Methods

**What we built:** Sampling tool supporting attribute sampling (controls) and variable sampling (substantive), with confidence levels, expected deviation rates, and precision calculations.

**Why this approach:**
- Sampling is mathematically complex
- Incorrect samples expose the firm to risk
- Need to document sample selection methodology
- Results must be statistically valid

**Alternatives considered:**
- AICPA tables only: Doesn't show calculations
- External tools: Data doesn't connect to workpapers

**Audit principle aligned:** AU-C 530 (Audit Sampling)

**Benefit to user:** Defensible sample sizes. Documentation of sampling rationale.

---

### Decision: Integrated Time Tracking

**What we built:** Time tracking integrated directly into the audit workflow. Time entries link to engagements, tasks, and workpapers. No separate timesheet system.

**Why this approach:**
- Auditors already use multiple systems
- Separate time systems require duplicate entry
- Linking time to work enables budget analysis
- Real-time budget vs. actual visibility

**Alternatives considered:**
- External time system integration: Complexity, sync issues
- No time tracking: Firms need this functionality

**Audit principle aligned:** N/A (operational requirement)

**Benefit to user:** One system for audit work and time tracking. Managers see real-time budget status.

---

### Decision: Rich Text Workpaper Editor

**What we built:** TipTap-based rich text editor for workpaper content with tables, formatting, images, and collaborative editing indicators.

**Why this approach:**
- Workpapers need formatting (tables, bullets, emphasis)
- Collaborative editing is increasingly common
- Content stored as structured JSON, not blobs
- Can render workpaper content in multiple formats

**Alternatives considered:**
- Markdown: Too technical for some users
- Word document upload: Loses structure, can't search content

**Audit principle aligned:** ISA 230 - documentation legibility and understandability

**Benefit to user:** Professional-looking workpapers. Content is searchable and structured.

---

## Data Model Decisions

### Decision: Audits vs. Engagements Terminology

**What we built:** We use "Engagements" as the primary term in the UI (matching external audit firm terminology) while the database uses "audits" (matching internal audit terminology).

**Why this approach:**
- External audit firms call them "engagements"
- The platform serves both external and internal audit
- Flexibility to support different terminology preferences

**Alternatives considered:**
- Single term everywhere: Confuses one audience

**Audit principle aligned:** N/A (terminology choice)

**Benefit to user:** Familiar terminology for external audit professionals.

---

### Decision: Reference Number System for Workpapers

**What we built:** Workpapers have firm-defined reference numbers (e.g., "WP-A-100", "C-3") that follow the firm's existing indexing convention.

**Why this approach:**
- Audit firms have established reference systems
- Partners and reviewers think in reference numbers
- Cross-references between workpapers use these numbers
- Peer reviewers expect consistent indexing

**Alternatives considered:**
- Auto-generated IDs: Loses meaning, breaks habits
- Numeric only: Less flexible, less familiar

**Audit principle aligned:** ISA 230 - audit file organization

**Benefit to user:** Keep existing reference conventions. Workpapers feel familiar.

---

## Security Decisions

### Decision: Row-Level Security on All Tables

**What we built:** Every database table has RLS policies that enforce firm isolation and role-based access. Users can only see data they're authorized to access.

**Why this approach:**
- Defense in depth: even if application code has bugs, data is protected
- Regulatory compliance (SOC 2)
- Audit firms handle extremely sensitive client data
- Cannot risk cross-firm data exposure

**Alternatives considered:**
- Application-level security only: Single point of failure

**Audit principle aligned:** ISQC 1 - confidentiality and information security

**Benefit to user:** Cryptographic certainty that client data is protected.

---

### Decision: Invitation-Based User Onboarding

**What we built:** New users join via invitation links sent by firm administrators. Invitations expire, specify roles, and are tracked.

**Why this approach:**
- Prevents unauthorized access
- Firm controls who joins their tenant
- Role assignment happens at invitation time
- Audit trail of who invited whom

**Alternatives considered:**
- Open signup with approval: More friction, less control
- SSO only: Not all firms have SSO

**Audit principle aligned:** ISQC 1 - human resources

**Benefit to user:** Complete control over firm membership. Clear onboarding process.

---

## Performance Decisions

### Decision: TanStack Query for Data Fetching

**What we built:** All data fetching uses TanStack Query with intelligent caching, background refetching, and optimistic updates.

**Why this approach:**
- Audit software has complex data relationships
- Users switch between contexts frequently
- Caching prevents redundant fetches
- Optimistic updates feel instant

**Alternatives considered:**
- Redux: More boilerplate, no built-in caching
- Plain fetch: No caching, manual state management

**Audit principle aligned:** N/A (technical decision)

**Benefit to user:** Fast, responsive interface. Data feels "live" without manual refresh.

---

### Decision: Virtualized Lists for Large Data Sets

**What we built:** Long lists (workpapers, findings, procedures) use virtualization to render only visible items.

**Why this approach:**
- Large engagements have hundreds of workpapers
- DOM performance degrades with many elements
- Users need to browse large lists without lag

**Alternatives considered:**
- Pagination: Breaks mental model of single list
- Load more: Still accumulates DOM elements

**Audit principle aligned:** N/A (technical decision)

**Benefit to user:** Smooth scrolling even with thousands of items.

---

## Future-Proofing Decisions

### Decision: AI Agent Infrastructure

**What we built:** Database tables and types for AI agents, workflows, executions, and prompts. Infrastructure for future AI-powered features.

**Why this approach:**
- AI will transform audit work
- Need infrastructure before features
- Want to capture execution history and costs
- Allows experimentation with different models

**Alternatives considered:**
- Build AI features ad-hoc: Technical debt, inconsistency

**Audit principle aligned:** Forward-looking capability

**Benefit to user:** Platform is ready for AI-powered audit assistance.

---

### Decision: Multi-App Platform Architecture

**What we built:** App switcher and platform infrastructure supporting multiple specialized applications (Audit, Tax, Consulting) within the same platform.

**Why this approach:**
- Audit firms offer multiple services
- Users shouldn't need separate systems
- Shared client data across service lines
- Platform can expand beyond audit

**Alternatives considered:**
- Audit-only focus: Limits market, requires clients to use multiple systems

**Audit principle aligned:** N/A (business strategy)

**Benefit to user:** One platform for the entire firm, not just audit.
