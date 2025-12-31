# Obsidian Audit: User Journey Guide

## How to Use This Document
This guide maps how different users interact with Obsidian Audit.
Use it to navigate demos from any user's perspective.

---

## Persona: Staff Auditor

### Profile
- **Role:** Execute assigned procedures, document work
- **Experience:** 0-3 years
- **Primary concerns:** Clear instructions, efficient documentation, not making mistakes
- **Time in system:** 6-8 hours/day during fieldwork
- **Demo login:** staff@obsidian-audit.com / demo123456

### What They're Thinking
- "What do I need to do today?"
- "How do I document this properly?"
- "Is this good enough for review?"
- "Where do I save this evidence?"

### Entry Point
Staff auditors typically enter via:
1. Dashboard → My Procedures (most common)
2. Direct engagement link from manager
3. Notification about new assignment

### Daily Workflow

#### Morning: Check Assignments
**Screen:** `/workspace` (My Workspace)
**Actions:**
1. View "My Procedures" widget → See what's assigned today
2. Check badge count for pending items
3. Click into highest priority procedure

**What to show in demo:**
- Badge counts showing assigned items
- Clear priority indicators
- Due dates visible at a glance

#### Mid-Day: Execute Procedures
**Screen:** `/my-procedures` → Procedure Detail
**Actions:**
1. Open assigned procedure
2. Read procedure instructions
3. Perform the work (may involve client systems)
4. Create or update workpaper
5. Attach evidence files
6. Update procedure status
7. Log time

**What to show in demo:**
- Clear procedure instructions
- Easy workpaper creation from procedure
- Evidence upload with drag-and-drop
- Integrated time entry

#### Afternoon: Submit for Review
**Screen:** `/workpapers/:id` (Workpaper Editor)
**Actions:**
1. Review own work for completeness
2. Click "Submit for Review"
3. Workpaper status changes to "In Review"
4. Move to next assigned procedure

**What to show in demo:**
- One-click submission
- Status change confirmation
- Automatic notification to reviewer

### Key Screens for Staff (Navigate in this order)
1. `/workspace` - Home base, see all assignments
2. `/my-procedures` - List of assigned procedures
3. `/workpapers/:id` - Create/edit workpapers
4. `/evidence` - View/upload evidence
5. `/tasks` - Additional assigned tasks

### Pain Points We Solve

| Before Obsidian | After Obsidian |
|-----------------|----------------|
| Unclear what's assigned, hunting through emails | Clear task list with priorities and due dates |
| Template hunting, copy-paste from last year | Pre-populated workpapers with procedure guidance |
| "Where do I save this evidence?" | Attach directly to workpaper, automatic organization |
| "How do I log my time?" | Integrated time tracking, no separate system |
| "Did my manager see my question?" | Review notes with read receipts and responses |

### Demo Script: Staff Perspective (3 min)

> "Let me show you what a typical morning looks like for a staff auditor..."

1. Login as staff user
2. Show workspace with badge counts
3. Navigate to My Procedures
4. Click into a procedure with clear instructions
5. Show workpaper creation from procedure
6. Demonstrate evidence upload
7. Show "Submit for Review" button
8. Show integrated time entry

---

## Persona: Senior Auditor / In-Charge

### Profile
- **Role:** Lead fieldwork, supervise staff, first-level review
- **Experience:** 3-5 years
- **Primary concerns:** Team progress, quality control, timeline management
- **Time in system:** 4-6 hours/day, more during planning/review
- **Demo login:** demo@obsidian-audit.com / demo123456

### What They're Thinking
- "Are we on track?"
- "Who needs help?"
- "Will this survive partner review?"
- "What do I need from the client?"

### Entry Point
Seniors typically enter via:
1. Dashboard → Engagement overview
2. Review Queue (badge notification)
3. Team progress view

### Key Responsibilities

#### Team Oversight
**Screen:** `/engagements/:id/dashboard`
**Actions:**
1. See progress by section
2. Identify bottlenecks (red indicators)
3. Reassign work if needed
4. Monitor hours vs. budget

**What to show in demo:**
- Progress percentages calculated from actual work
- Visual indicators for behind-schedule items
- Team member workload view
- Budget vs. actual hours

#### First-Level Review
**Screen:** `/review-queue`
**Actions:**
1. Open workpaper ready for review
2. Evaluate documentation quality
3. Add review notes for issues
4. Clear previous notes that were addressed
5. Sign off if acceptable

**What to show in demo:**
- Queue sorted by priority
- Review note creation
- Preparer response visibility
- One-click signoff

#### Client Interaction Prep
**Screen:** `/engagements/:id` → Engagement Detail
**Actions:**
1. Summarize open items for client call
2. Check PBC (info request) status
3. Prepare client communication

**What to show in demo:**
- Information request tracking
- Outstanding items summary
- Export for client communication

### Key Screens for Seniors
1. `/engagements/:id/dashboard` - Engagement metrics
2. `/review-queue` - Items pending review
3. `/workpapers` - All engagement workpapers
4. `/information-requests` - PBC tracking
5. `/findings` - Finding management

### Pain Points We Solve

| Before Obsidian | After Obsidian |
|-----------------|----------------|
| Status meetings based on memory | Real-time progress from actual work status |
| Review notes lost in email | Preserved review dialogue on workpapers |
| Manually tracking PBC items | Integrated information request tracking |
| Spreadsheet for team assignments | Visual team workload management |

### Demo Script: Senior Perspective (4 min)

> "Now let me show you the senior auditor view..."

1. Navigate to Engagement Dashboard
2. Show calculated progress (not manually entered)
3. Show team workload visualization
4. Navigate to Review Queue
5. Open a workpaper for review
6. Add a review note
7. Show the review dialogue structure
8. Demonstrate signoff process

---

## Persona: Audit Manager

### Profile
- **Role:** Oversee multiple engagements, final quality review, client relationship
- **Experience:** 5-10 years
- **Primary concerns:** Quality, deadlines, client satisfaction, team development
- **Time in system:** 2-4 hours/day, more at wrap-up
- **Demo login:** manager@obsidian-audit.com / demo123456

### What They're Thinking
- "Are my engagements on track?"
- "Any issues I need to escalate to the partner?"
- "Is the documentation peer-review ready?"
- "How are budgets looking across engagements?"

### Entry Point
Managers typically enter via:
1. Dashboard → Engagement overview (multiple engagements)
2. Approval notifications
3. Quality control alerts

### Key Responsibilities

#### Multi-Engagement Oversight
**Screen:** `/engagements`
**Actions:**
1. View all managed engagements
2. Identify at-risk engagements
3. Drill into specific concerns
4. Prioritize attention

**What to show in demo:**
- Engagement list with status indicators
- Filter by status, due date, client
- Risk indicators visible at a glance

#### Quality Review
**Screen:** `/engagements/:id/review` or `/quality-control`
**Actions:**
1. Review signoff status by section
2. Evaluate completion percentages
3. Identify gaps before partner review
4. Document manager-level conclusions

**What to show in demo:**
- Signoff chain visibility
- Incomplete sections highlighted
- Manager signoff process

#### Finding Communication
**Screen:** `/findings`
**Actions:**
1. Review significant findings
2. Draft management letter points
3. Discuss with client
4. Document management response

**What to show in demo:**
- Finding list with severity
- Condition/Criteria/Cause/Effect structure
- Management response workflow
- Export for management letter

### Key Screens for Managers
1. `/engagements` - All managed engagements
2. `/engagements/:id/dashboard` - Individual engagement health
3. `/quality-control` - QC dashboard
4. `/findings` - Finding management
5. `/engagements/approvals` - Approval queue
6. `/analytics` - Cross-engagement analytics

### Pain Points We Solve

| Before Obsidian | After Obsidian |
|-----------------|----------------|
| Check multiple systems for engagement status | Single dashboard for all engagements |
| Manual quality checklists | Automated quality metrics |
| Findings scattered across workpapers | Centralized findings management |
| Budget tracking in separate spreadsheet | Integrated budget vs. actual |

### Demo Script: Manager Perspective (4 min)

> "For managers overseeing multiple engagements..."

1. Show engagement list with status indicators
2. Click into engagement dashboard
3. Show calculated progress metrics
4. Navigate to Quality Control dashboard
5. Show signoff chain status
6. Navigate to Findings
7. Demonstrate management response workflow
8. Show analytics across engagements

---

## Persona: Audit Partner

### Profile
- **Role:** Final responsibility, client relationship, firm leadership
- **Experience:** 10+ years, CPA
- **Primary concerns:** Audit quality, firm reputation, regulatory compliance
- **Time in system:** 30-60 min/day, more at planning and signoff
- **Demo login:** partner@obsidian-audit.com / demo123456

### What They're Thinking
- "Can I sign this opinion with confidence?"
- "Will this survive peer review?"
- "Any reputation risks I should know about?"
- "How is the firm performing overall?"

### Entry Point
Partners typically enter via:
1. Dashboard → High-level metrics
2. Approval notifications requiring partner signoff
3. Quality alerts

### Key Responsibilities

#### Final Review and Signoff
**Screen:** `/engagements/:id/review` or Approval Dashboard
**Actions:**
1. Review completion status
2. Verify all signoffs in place
3. Review significant findings
4. Sign engagement (final approval)

**What to show in demo:**
- Clear signoff status
- Outstanding items highlighted
- One-click visibility into any concern
- Partner signoff process

#### Risk Oversight
**Screen:** `/risks` or `/quality-control`
**Actions:**
1. Review high-risk engagements
2. Verify appropriate procedures performed
3. Ensure findings properly addressed

**What to show in demo:**
- Risk-sorted engagement view
- High-risk procedure completion
- Finding resolution status

#### Firm Performance
**Screen:** `/analytics`
**Actions:**
1. View firm-wide metrics
2. Identify efficiency opportunities
3. Review quality trends

**What to show in demo:**
- Utilization metrics
- Quality trend analysis
- Budget performance across engagements

### Key Screens for Partners
1. `/workspace` - Personal dashboard with alerts
2. `/engagements/approvals` - Items requiring partner approval
3. `/quality-control` - Firm-wide QC metrics
4. `/analytics` - Performance analytics
5. `/admin` - Administration (if also admin)

### Pain Points We Solve

| Before Obsidian | After Obsidian |
|-----------------|----------------|
| Can't verify all review occurred | Complete signoff chain visibility |
| Ask manager "are we ready?" | See completion status directly |
| Peer review findings on documentation | Automated documentation quality |
| Scattered information about engagement | One-click access to everything |

### Demo Script: Partner Perspective (3 min)

> "For partners, the view is about oversight and confidence..."

1. Show high-level dashboard
2. Navigate to an engagement
3. Show completion and signoff status
4. Demonstrate traceability (conclusion → evidence)
5. Show Quality Control dashboard
6. Demonstrate partner signoff
7. Show analytics for firm performance

---

## Persona: Firm Administrator

### Profile
- **Role:** IT administration, user management, system configuration
- **Experience:** Varies, may not be audit professional
- **Primary concerns:** Security, user access, system stability
- **Time in system:** As needed for administration
- **Demo login:** (admin features visible to partner login)

### Entry Point
Admins typically enter via:
1. Settings → Team Management
2. Admin Dashboard
3. Security alerts

### Key Responsibilities

#### User Management
**Screen:** `/admin/users`
**Actions:**
1. Invite new users
2. Set roles and permissions
3. Deactivate departing staff
4. Monitor active sessions

**What to show in demo:**
- User invitation flow
- Role assignment
- Bulk import option
- Activity logging

#### Firm Configuration
**Screen:** `/settings` → various tabs
**Actions:**
1. Configure branding
2. Set notification preferences
3. Manage integrations
4. Review security settings

**What to show in demo:**
- Branding options
- Notification settings
- Security configuration

### Key Screens for Admins
1. `/admin` - Admin dashboard
2. `/admin/users` - User management
3. `/settings` - Configuration
4. Audit logs (within admin)

---

## Cross-Persona Workflows

### Workflow: Review Cycle

How a workpaper moves from staff → senior → manager → partner:

```
┌──────────────────────────────────────────────────────────────┐
│                     REVIEW WORKFLOW                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  STAFF AUDITOR                                               │
│  ┌─────────────────┐                                         │
│  │ 1. Create WP    │                                         │
│  │ 2. Document     │                                         │
│  │ 3. Submit       │──────────────────────┐                  │
│  └─────────────────┘                      │                  │
│                                           ▼                  │
│  SENIOR AUDITOR              ┌─────────────────────┐         │
│  ┌─────────────────┐         │ Status: In Review   │         │
│  │ 4. Review       │◄────────│ Notification sent   │         │
│  │ 5. Add notes    │         └─────────────────────┘         │
│  │ 6. Approve/     │                                         │
│  │    Reject       │──────────────────────┐                  │
│  └─────────────────┘                      │                  │
│          │                                │                  │
│          │ If notes added                 │                  │
│          ▼                                ▼                  │
│  ┌─────────────────┐         ┌─────────────────────┐         │
│  │ Staff responds  │         │ Status: Sr Reviewed │         │
│  │ to notes        │         │ Ready for manager   │         │
│  └─────────────────┘         └─────────────────────┘         │
│                                           │                  │
│  MANAGER                                  │                  │
│  ┌─────────────────┐                      │                  │
│  │ 7. Final review │◄─────────────────────┘                  │
│  │ 8. Approve      │                                         │
│  └─────────────────┘                                         │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────────┐                                     │
│  │ Status: Approved    │                                     │
│  │ Ready for signoff   │                                     │
│  └─────────────────────┘                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Demo flow:**
1. Start at workpaper in draft
2. Show submit for review
3. Switch to senior view, show review queue
4. Add a review note
5. Show how staff sees and responds
6. Complete senior review
7. Show manager final approval

### Workflow: Finding Lifecycle

How a finding is created → discussed → resolved:

```
┌──────────────────────────────────────────────────────────────┐
│                    FINDING LIFECYCLE                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────────┐              │
│  │ 1. Identified   │───▶│ Finding Created     │              │
│  │    during       │    │ Status: Open        │              │
│  │    procedure    │    │ Linked to workpaper │              │
│  └─────────────────┘    └─────────────────────┘              │
│                                   │                          │
│                                   ▼                          │
│                         ┌─────────────────────┐              │
│                         │ 2. Documented       │              │
│                         │ - Condition         │              │
│                         │ - Criteria          │              │
│                         │ - Cause             │              │
│                         │ - Effect            │              │
│                         │ - Recommendation    │              │
│                         └─────────────────────┘              │
│                                   │                          │
│                                   ▼                          │
│                         ┌─────────────────────┐              │
│                         │ 3. Client notified  │              │
│                         │ Status: Pending     │              │
│                         │ Response            │              │
│                         └─────────────────────┘              │
│                                   │                          │
│                                   ▼                          │
│                         ┌─────────────────────┐              │
│                         │ 4. Management       │              │
│                         │    responds         │              │
│                         │ - Action plan       │              │
│                         │ - Target date       │              │
│                         │ - Responsible party │              │
│                         └─────────────────────┘              │
│                                   │                          │
│                                   ▼                          │
│                         ┌─────────────────────┐              │
│                         │ 5. Auditor reviews  │              │
│                         │    response         │              │
│                         │ Status: In Progress │              │
│                         └─────────────────────┘              │
│                                   │                          │
│                                   ▼                          │
│                         ┌─────────────────────┐              │
│                         │ 6. Remediation      │              │
│                         │    verified         │              │
│                         │ Status: Resolved    │              │
│                         └─────────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Demo flow:**
1. Navigate to Findings
2. Show finding creation from procedure
3. Walk through structured documentation
4. Show management response section
5. Demonstrate resolution workflow
6. Show finding history

### Workflow: Engagement Setup

How a new engagement gets created and staffed:

```
┌──────────────────────────────────────────────────────────────┐
│                  ENGAGEMENT SETUP                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐                                         │
│  │ 1. Create from  │                                         │
│  │    template or  │                                         │
│  │    scratch      │                                         │
│  └─────────────────┘                                         │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────┐    ┌─────────────────────┐              │
│  │ 2. Set basic    │───▶│ - Client            │              │
│  │    info         │    │ - Engagement type   │              │
│  │                 │    │ - Fiscal year end   │              │
│  │                 │    │ - Timeline          │              │
│  └─────────────────┘    └─────────────────────┘              │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────┐    ┌─────────────────────┐              │
│  │ 3. Assign team  │───▶│ - Partner           │              │
│  │                 │    │ - Manager           │              │
│  │                 │    │ - Seniors           │              │
│  │                 │    │ - Staff             │              │
│  └─────────────────┘    └─────────────────────┘              │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────┐    ┌─────────────────────┐              │
│  │ 4. Planning     │───▶│ - Materiality       │              │
│  │    setup        │    │ - Risk assessment   │              │
│  │                 │    │ - Audit programs    │              │
│  └─────────────────┘    └─────────────────────┘              │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────┐                                         │
│  │ 5. Assign       │                                         │
│  │    procedures   │                                         │
│  │    to team      │                                         │
│  └─────────────────┘                                         │
│          │                                                   │
│          ▼                                                   │
│  ┌─────────────────┐                                         │
│  │ ENGAGEMENT      │                                         │
│  │ ACTIVE          │                                         │
│  │ Team notified   │                                         │
│  └─────────────────┘                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Demo flow:**
1. Navigate to Engagements
2. Click Create New
3. Select template (or from scratch)
4. Fill basic information
5. Assign team members
6. Show procedure assignment
7. Demonstrate notification flow
