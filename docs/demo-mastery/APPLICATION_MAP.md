# Obsidian Audit: Application Map

## Quick Navigation Index

| Category | Route | Page | Purpose |
|----------|-------|------|---------|
| **Public** | `/` | Landing | Marketing/product info |
| **Auth** | `/auth/login` | Login | User authentication |
| **Auth** | `/auth/signup` | Signup | New user registration |
| **Auth** | `/auth/forgot-password` | ForgotPassword | Password recovery |
| **Auth** | `/auth/accept-invite/:token` | AcceptInvitation | Team invitation |
| **Auth** | `/auth/accept-firm-invite/:token` | AcceptFirmInvitation | Firm invitation |
| **Platform** | `/platform/ontology` | OntologyPage | Product: Data model |
| **Platform** | `/platform/audit` | AuditPage | Product: Audit module |
| **Platform** | `/platform/codex` | CodexPage | Product: Knowledge base |
| **Platform** | `/platform/forge` | ForgePage | Product: Automation |
| **Contact** | `/contact` | ContactPage | Sales contact |
| **Workspace** | `/workspace` | MyWorkspace | Personal dashboard |
| **Inbox** | `/inbox` | InboxPage | Notifications |
| **Clients** | `/clients` | ClientsPage | Client management |
| **Audit Core** | `/universe` | AuditUniverse | Audit universe |
| **Audit Core** | `/risks` | RiskAssessments | Risk assessment |
| **Audit Core** | `/plans` | AuditPlans | Audit planning |
| **Audits** | `/audits` | ActiveAuditsList | Active audits |
| **Audits** | `/audits/:auditId/workpapers` | AuditWorkpapers | Audit workpapers |
| **Programs** | `/programs` | ProgramLibrary | Program library |
| **Programs** | `/programs/:id` | ProgramDetail | Program detail |
| **Procedures** | `/procedures` | ProcedureLibrary | Procedure library |
| **Procedures** | `/my-procedures` | MyProcedures | Assigned procedures |
| **Workpapers** | `/workpapers` | WorkpapersLanding | Workpaper list |
| **Workpapers** | `/workpapers/:id` | WorkpaperEditor | Edit workpaper |
| **Findings** | `/findings` | FindingsManagement | Findings/issues |
| **Evidence** | `/evidence` | EvidenceLibrary | Evidence library |
| **Review** | `/review-queue` | ProcedureReviewQueue | Review queue |
| **QC** | `/quality-control` | QualityControlDashboard | Quality control |
| **Tasks** | `/tasks` | TaskBoard | Task management |
| **IR** | `/information-requests` | InformationRequests | PBC/Client requests |
| **Analytics** | `/analytics` | ProgramAnalytics | Analytics dashboard |
| **Tools** | `/tools/materiality` | MaterialityCalculatorPage | Materiality calc |
| **Tools** | `/tools/sampling` | SamplingCalculatorPage | Sampling calc |
| **Tools** | `/tools/confirmations` | ConfirmationTrackerPage | Confirmation tracking |
| **Tools** | `/tools/analytical-procedures` | AnalyticalProceduresPage | Analytical procedures |
| **Engagements** | `/engagements` | EngagementList | Engagement list |
| **Engagements** | `/engagements/:id` | EngagementDetail | Engagement detail |
| **Engagements** | `/engagements/:id/dashboard` | EngagementDashboard | Engagement metrics |
| **Engagements** | `/engagements/:id/audit` | EngagementDetailAudit | Audit execution |
| **Engagements** | `/engagements/:id/review` | ReviewQueuePage | Engagement review |
| **Engagements** | `/engagements/:engagementId/assign-procedures` | ProcedureAssignment | Assign procedures |
| **Engagements** | `/engagements/templates` | EngagementTemplates | Templates |
| **Engagements** | `/engagements/approvals` | ApprovalDashboard | Approvals |
| **Admin** | `/settings` | Settings | User settings |
| **Admin** | `/admin` | AdminDashboard | Admin overview |
| **Admin** | `/admin/users` | UserManagement | User management |

---

## Navigation Structure

### Sidebar Sections (Role-Based)

```
Dashboard
├── Dashboard (/dashboard → redirects to /workspace)

My Work [Internal Roles Only]
├── My Procedures (/my-procedures) [Badge: count]
├── Tasks (/tasks) [Badge: count]
├── Time Tracking (/time-tracking)
└── Review Queue (/review-queue) [Senior+ only, Badge: count]

Engagements
├── Active Engagements (/engagements)
├── Clients (/clients)
├── Templates (/engagements/templates) [Manager+ only]
└── Approvals (/engagements/approvals) [Manager+ only, Badge: count]

Audit Execution [Internal Roles Only]
├── Workpapers (/workpapers)
├── Findings (/findings) [Badge: count]
├── Evidence (/evidence)
└── Info Requests (/information-requests) [Badge: count]

Tools & Libraries [Internal Roles Only]
├── Program Library (/programs)
├── Procedure Library (/procedures)
├── Materiality (/tools/materiality) [Senior+ only]
├── Sampling (/tools/sampling)
├── Analytical Procedures (/tools/analytical-procedures)
└── Confirmations (/tools/confirmations) [Badge: count]

Planning & Risk [Manager+ Only]
├── Audit Universe (/universe)
├── Risk Assessments (/risks)
└── Audit Plans (/plans)

Quality & Analytics [Senior+ Only]
├── QC Dashboard (/quality-control) [Badge: dot]
└── Analytics (/analytics)

Administration [Admin Only]
├── User Management (/admin/users)
├── Team Directory (/admin/users)
└── Settings (/settings)
```

---

## Role Hierarchy

| Role | Access Level |
|------|--------------|
| `staff_auditor` | Basic execution, own work |
| `senior_auditor` | + Review, tools access |
| `engagement_manager` | + Planning, approvals, team mgmt |
| `partner` | + Firm-wide, final signoff |
| `practice_leader` | + Multi-engagement oversight |
| `firm_administrator` | Full admin access |
| `business_development` | Limited, client-facing |
| `client_contact` | Portal access only |
| `quality_control_reviewer` | QC specific access |

---

## Feature Categories

### 1. Engagement Management
- **Engagement List** - View/create/filter engagements
- **Engagement Detail** - Full engagement context
- **Engagement Dashboard** - Metrics, progress, quick actions
- **Templates** - Reusable engagement templates
- **Approvals** - Engagement approval workflow

### 2. Audit Execution Core
- **Workpapers** - Create, edit, review documentation
- **Procedures** - Execute assigned procedures
- **Findings** - Document issues (Condition/Criteria/Cause/Effect)
- **Evidence** - Manage supporting documentation
- **Information Requests** - PBC tracking

### 3. Planning & Risk
- **Audit Universe** - Auditable entity management
- **Risk Assessments** - Risk identification and scoring
- **Audit Plans** - Annual/engagement planning

### 4. Audit Tools
- **Materiality Calculator** - AU-C 320 compliant calculations
- **Sampling Calculator** - Statistical/non-statistical sampling
- **Confirmation Tracker** - Bank, AR, legal confirmations
- **Analytical Procedures** - Ratio analysis, trend analysis

### 5. Review & Quality
- **Review Queue** - Items pending review
- **Quality Control Dashboard** - Firm-wide QC metrics
- **Signoff Workflow** - Preparer → Reviewer → Approver

### 6. Administration
- **User Management** - Invite, roles, permissions
- **Settings** - Profile, notifications, preferences
- **Firm Settings** - Branding, team, billing

---

## Component Architecture

```
src/
├── App.tsx                    # Main router configuration
├── components/
│   ├── AppLayout.tsx          # Main authenticated layout
│   ├── AppSidebar.tsx         # Navigation sidebar
│   ├── guards/
│   │   ├── RequireAuth.tsx    # Auth protection
│   │   └── RequireRole.tsx    # Role-based access
│   ├── audit/
│   │   ├── workpapers/        # Workpaper components
│   │   ├── findings/          # Finding components
│   │   └── procedures/        # Procedure components
│   ├── audit-tools/           # Calculator components
│   ├── engagement/            # Engagement components
│   └── ui/                    # Radix UI primitives
├── pages/
│   ├── audit/                 # Audit execution pages
│   ├── audit-tools/           # Tool pages
│   ├── engagement/            # Engagement pages
│   ├── admin/                 # Admin pages
│   └── platform/              # Marketing pages
├── hooks/                     # Custom React hooks
├── contexts/                  # React contexts
├── config/
│   └── navigation.ts          # Navigation configuration
├── lib/                       # Business logic
└── integrations/
    └── supabase/              # Supabase client & types
```

---

## Data Flow

```
User Action
    ↓
React Component (Page/Form)
    ↓
Custom Hook (useWorkpapers, useFindingManagement, etc.)
    ↓
TanStack Query (caching, optimistic updates)
    ↓
Supabase Client
    ↓
PostgreSQL + Row Level Security
```

---

## Key UI Patterns

### 1. List → Detail Navigation
- List page shows summary cards or table
- Click navigates to `/[entity]/:id`
- Breadcrumbs for back navigation

### 2. Dialog-Based Creation
- "Add" button opens dialog
- Form submission creates entity
- List auto-refreshes (TanStack Query)

### 3. Tab-Based Detail Views
- Entity detail pages use tabs
- Common pattern: Overview | Details | Activity | Settings

### 4. Status Badges
- Consistent color coding across app
- Draft (gray), In Review (blue), Approved (green), Rejected (red)

### 5. Role-Based UI
- Navigation items show/hide based on role
- Actions disabled/enabled based on permissions
- Tooltips explain why actions unavailable
