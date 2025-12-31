# Obsidian Audit Platform - Comprehensive Codebase Analysis

**Generated:** December 27, 2025
**Project Location:** `/Users/abdulkarimsankareh/Downloads/Work-Projects/Obsidian/Audit`
**Platform:** Enterprise Audit Execution Engine

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [Application Routes](#application-routes)
3. [Component Architecture](#component-architecture)
4. [Hooks & Data Fetching](#hooks--data-fetching)
5. [Context & State Management](#context--state-management)
6. [Technology Stack](#technology-stack)
7. [Architectural Patterns](#architectural-patterns)

---

## Database Schema

### Overview
The application uses **Supabase PostgreSQL** with comprehensive audit-specific tables. Database types are auto-generated in `/src/integrations/supabase/types.ts` from the Supabase schema.

**Total Tables:** 150+ (including functions and views)  
**Organization Model:** Multi-tenant (firms-based organization)  
**Primary Key Concept:** `firm_id` (organization ID) for data isolation

### Core Tables by Domain

#### 1. **Authentication & Access Control**
```
profiles
├─ Columns: id, firm_id, full_name, first_name, last_name, email, avatar_url
├─ Relations: One-to-many with user_roles, user_invitations
└─ RLS: Tenant-scoped (users see only their organization's data)

user_roles
├─ Columns: user_id, role, firm_id, created_at
├─ Role Values: partner, firm_administrator, senior_auditor, engagement_manager, 
                practice_leader, business_development, client_administrator, client_user, 
                staff_auditor, quality_control_reviewer
└─ Relations: Many-to-one with profiles

firms
├─ Columns: id, slug, name, logo_url, primary_color, custom_domain, created_at
├─ Purpose: Multi-tenant organization container
└─ Relations: One-to-many with all tenant-scoped tables
```

#### 2. **Engagement Management**
```
engagements
├─ Columns: id, firm_id, client_id, engagement_type, status, start_date, end_date,
            estimated_hours, actual_hours, budget, created_by, updated_at
├─ Status Values: draft, accepted, in_progress, complete, on_hold, cancelled
├─ Relations: One-to-many with engagement_programs, engagement_procedures, 
              engagement_deliverables, engagement_letters
└─ Purpose: Core engagement container

clients
├─ Columns: id, firm_id, name, industry, company_size, risk_level, created_at
├─ Relations: One-to-many with engagements, client_contacts, client_meetings
└─ Purpose: External client/customer entity

engagement_deliverables
├─ Columns: id, engagement_id, name, description, due_date, status, assigned_to
├─ Relations: One-to-many with deliverable_versions, deliverable_approvals
└─ Purpose: Track audit deliverables/outputs

engagement_letters
├─ Columns: id, engagement_id, template_id, content, signed_date, signed_by
├─ Status: draft, sent, pending_signature, signed, expired, superseded
└─ Purpose: Professional engagement documentation
```

#### 3. **Audit Programs & Procedures**
```
audit_programs
├─ Columns: id, firm_id, name, description, audit_type, created_by, version
├─ Audit Types: financial_statement, internal_control, compliance, other
├─ Relations: One-to-many with audit_procedures, engagement_programs
└─ Purpose: Template library for audit procedures

audit_program_templates
├─ Columns: id, firm_id, name, category, procedures (JSON), risk_mapping (JSON)
├─ Purpose: Reusable program structures
└─ Relations: One-to-many with engagement_programs

audit_procedures
├─ Columns: id, program_id, name, description, audit_objective, risk_areas (array),
            estimated_hours, control_tested, procedure_type
├─ Relations: One-to-many with audit_workpapers, engagement_procedures
└─ Purpose: Individual procedures within programs

engagement_procedures
├─ Columns: id, engagement_id, procedure_id, assigned_to, status, completion_date,
            hours_spent, review_status
├─ Status: not_started, in_progress, in_review, complete, not_applicable
├─ Review Status: pending_review, reviewed, approved, requires_revision
└─ Purpose: Instantiation of procedures within specific engagements

procedure_dependencies
├─ Columns: id, from_procedure_id, to_procedure_id, dependency_type
├─ Dependency Types: must_complete, must_start, should_complete, informational
└─ Purpose: Define procedure execution sequencing
```

#### 4. **Workpapers & Evidence**
```
audit_workpapers
├─ Columns: id, engagement_id, procedure_id, title, content (rich text), 
            created_by, reviewed_by, status, version
├─ Relations: One-to-many with workpaper_versions, workpaper_signoffs,
              audit_evidence, workpaper_comments
└─ Purpose: Core working papers for procedures

audit_evidence
├─ Columns: id, workpaper_id, type, name, file_path, description, created_by,
            linked_procedures (array), evidence_strength
├─ Evidence Strength: strong, moderate, weak
├─ Relations: Many-to-many with audit_procedures (linked_procedures)
└─ Purpose: Support documentation for workpapers

audit_findings
├─ Columns: id, engagement_id, procedure_id, title, description, rating,
            condition, criteria, cause, effect, recommendation, management_response,
            created_by, finding_category, repeat_finding
├─ Relations: One-to-many with audit_finding_follow_up
└─ Purpose: Exception documentation

workpaper_comments
├─ Columns: id, workpaper_id, user_id, content, is_resolved, created_at
├─ Purpose: Collaborative review comments
└─ Relations: Many-to-one with audit_workpapers
```

#### 5. **Risk Assessment & Materiality**
```
risk_assessments
├─ Columns: id, engagement_id, created_by, initial_risk_level, control_risk,
            inherent_risk, detection_risk, materiality_amount, performance_materiality
├─ Risk Levels: low, medium, high, significant
├─ Relations: One-to-many with risk_areas, control_walkthroughs
└─ Purpose: Engagement-level risk and materiality determination

risk_areas
├─ Columns: id, risk_assessment_id, area_name, inherent_risk, control_risk,
            required_testing, assessment_basis, category
├─ Categories: balance_sheet, income_statement, control_environment, other
└─ Purpose: Granular risk assessment by functional area

control_walkthroughs
├─ Columns: id, risk_assessment_id, control_id, objective, test_of_design,
            test_of_effectiveness, walkthrough_date, conclusion
└─ Purpose: Design and effectiveness testing of controls

audit_plans
├─ Columns: id, engagement_id, created_by, planned_procedures (JSON),
            planned_hours, planned_budget, audit_strategy, sampling_approach
└─ Purpose: Formal audit planning documentation
```

#### 6. **Sampling & Analytics**
```
sampling_selections
├─ Columns: id, engagement_id, population_size, sample_size, sampling_method,
            selection_criteria, items_selected (JSON), created_by
├─ Sampling Methods: statistical, judgmental, stratified, systematic, haphazard
└─ Purpose: Sample selection for substantive testing

analytical_procedures
├─ Columns: id, engagement_id, procedure_type, benchmark_data, current_year_data,
            variance_analysis, conclusion, performed_by, procedure_date
├─ Procedure Types: ratio_analysis, trend_analysis, benchmarking, regression
└─ Purpose: Substantive analytical procedures
```

#### 7. **Quality Control & Review**
```
quality_control_reviews
├─ Columns: id, firm_id, reviewed_item_type, reviewed_item_id, reviewer_id,
            findings (JSON), status, review_date, completion_date
├─ Status: pending, in_progress, complete, requires_revision
└─ Purpose: Firm-level QC procedures

approval_workflows
├─ Columns: id, firm_id, name, is_default, created_by
├─ Purpose: Configurable approval templates
└─ Relations: One-to-many with approval_stages

approval_stages
├─ Columns: id, workflow_id, name, approval_type, stage_order, required_approvals
└─ Relations: One-to-many with approval_records

deliverable_approvals
├─ Columns: id, deliverable_id, workflow_id, current_stage, status, created_by
├─ Relations: One-to-many with approval_records
└─ Purpose: Track approval of deliverables through workflow

approval_records
├─ Columns: id, deliverable_approval_id, stage_id, approver_id, status,
            comments, decided_at
└─ Purpose: Individual approval decisions by stage
```

#### 8. **Professional Standards & Compliance**
```
engagement_acceptance_checklists
├─ Columns: id, engagement_id, checklist_items (JSON), status, completed_by,
            completed_date, approved_by
├─ Purpose: Engagement acceptance procedures per AU-C 210

client_aml_records
├─ Columns: id, client_id, risk_level, check_status, last_checked, created_by
├─ Purpose: Anti-money laundering compliance tracking

independence_declarations
├─ Columns: id, firm_id, engagement_id, declared_by, declaration (JSON),
            status, approval_date
├─ Purpose: Track independence confirmations

conflict_of_interest_register
├─ Columns: id, firm_id, conflict_type, party_a, party_b, status, 
            description, resolution
└─ Purpose: COI documentation and tracking
```

#### 9. **Engagement Workflow & Lifecycle**
```
engagement_budget_forecasts
├─ Columns: id, engagement_id, forecast_date, projected_hours, projected_cost,
            variance_from_budget, notes
└─ Purpose: Budget tracking and forecasting

engagement_milestones
├─ Columns: id, engagement_id, name, due_date, completion_date, status,
            assigned_to, description
└─ Purpose: Key engagement dates and deliverables

engagement_resource_conflicts
├─ Columns: id, engagement_id, resource_id, conflict_date, reason, resolution
└─ Purpose: Identify and track resource conflicts

engagement_communications
├─ Columns: id, engagement_id, type, recipient, subject, body, sent_date
├─ Types: email, meeting_minute, letter, memo
└─ Purpose: Track client communications
```

#### 10. **AI & Automation**
```
ai_agents
├─ Columns: id, firm_id, name, agent_type, status, configuration (JSON),
            system_prompt, model, is_template
├─ Agent Types: audit_assistant, document_analyzer, risk_assessor, other
└─ Purpose: Configurable AI automation agents

ai_workflows
├─ Columns: id, firm_id, name, agent_id, workflow_definition (JSON),
            trigger_type, trigger_config (JSON), status
└─ Purpose: Multi-step AI workflow definitions

ai_executions
├─ Columns: id, workflow_id, agent_id, status, execution_data (JSON),
            execution_result (JSON), tokens_used, cost_usd, duration_ms
└─ Purpose: Track AI execution history and costs

ai_prompts
├─ Columns: id, firm_id, name, prompt_template, model, temperature,
            max_tokens, variables (JSON), version
└─ Purpose: Prompt library management
```

#### 11. **Audit Tools & Calculations**
```
materiality_calculations
├─ Columns: id, engagement_id, benchmark_item, benchmark_amount,
            materiality_percentage, calculated_materiality, performance_materiality,
            clearly_trivial_threshold
└─ Purpose: Materiality calculation history

benfords_law_analyses
├─ Columns: id, engagement_id, dataset_name, expected_distribution (JSON),
            actual_distribution (JSON), chi_square_statistic, p_value,
            anomalies_detected (JSON)
└─ Purpose: Benford's Law analysis for fraud detection

trial_balance_data
├─ Columns: id, engagement_id, account_code, account_name, beginning_balance,
            debit_transactions, credit_transactions, ending_balance, 
            audit_adjustments_debit, audit_adjustments_credit
└─ Purpose: Trial balance import and analysis

confirmation_trackers
├─ Columns: id, engagement_id, confirmation_type, party_name, sent_date,
            response_received, response_date, response_amount (for receivables),
            discrepancies, status
├─ Confirmation Types: receivables, payables, debt, investments, other
└─ Purpose: Track confirmation procedures
```

#### 12. **Supporting Tables**
```
audit_entities
├─ Columns: id, firm_id, name, type, description, created_by
├─ Types: consolidated_group, subsidiary, division, department
└─ Purpose: Entity structure for group audits

audit_team_members
├─ Columns: id, engagement_id, user_id, role, hours_allocated,
            assigned_procedures (array)
└─ Purpose: Engagement team composition

projects (Note: Contains organization_id per latest migration)
├─ Columns: id, firm_id (also organization_id per migration), name,
            description, status, created_by
└─ Purpose: Project grouping for cross-engagement work

action_items
├─ Columns: id, firm_id, title, description, assigned_to, due_date,
            priority, status, related_engagement, related_finding
└─ Purpose: Task/action item tracking

tasks
├─ Columns: id, engagement_id, project_id, title, description, assigned_to,
            due_date, status, priority, created_by
└─ Purpose: Engagement-specific task management

meetings
├─ Columns: id, engagement_id, title, description, meeting_date, attendees (array),
            minutes_content, created_by
└─ Purpose: Meeting coordination and documentation
```

### Database Enums (User-Defined Types)

```typescript
// Role enumeration
enum app_role {
  partner, firm_administrator, senior_auditor, engagement_manager,
  practice_leader, business_development, client_administrator,
  client_user, staff_auditor, quality_control_reviewer
}

// Engagement lifecycle
enum engagement_status {
  draft, accepted, in_progress, complete, on_hold, cancelled
}

// Procedure execution
enum procedure_status {
  not_started, in_progress, in_review, complete, not_applicable
}

// Review workflows
enum approval_status {
  pending, approved, rejected, needs_revision
}

// Risk assessment
enum risk_level {
  low, medium, high, significant
}

// AI operations
enum ai_agent_status { active, inactive, archived }
enum ai_agent_type { audit_assistant, document_analyzer, risk_assessor }
enum ai_execution_status { pending, running, completed, failed, cancelled }
enum ai_trigger_type { manual, scheduled, event_based, webhook }
```

### Key Relationships & Constraints

1. **Tenant Isolation:** All tables with `firm_id` column are scoped to organization
2. **Cascading Relationships:**
   - Engagement → All engagement-related tables
   - Program → Procedures → Workpapers
   - Risk Assessment → Risk Areas → Procedures
3. **Foreign Key Structure:**
   - User tables link to `auth.users` (Supabase Auth)
   - All tables include `firm_id` for multi-tenancy
4. **RLS Policies:** Row-level security enforces `firm_id` isolation at database level

---

## Application Routes

### Route Structure (src/App.tsx)

The application implements **engagement-centric navigation** with comprehensive role-based access control.

#### Public Routes
```
/ (Index/Landing)
/auth/login
/auth/signup
/auth/forgot-password
/auth/accept-invite/:token (Individual user invitation)
/auth/accept-firm-invite/:token (Firm onboarding invitation)
```

#### Protected Routes (All require @RequireAuth wrapper)

**Main Workspace**
```
/workspace (RequireAuth)
  ├─ Index: MyWorkspace component
  └─ Widgets: QuickStatsBar, MyEngagementsWidget, MyTasksWidget, FirmOverviewWidget
```

**Audit Execution Core** (Engagement & Program Focus)
```
/universe (AuditUniverse)
  └─ Audit universe for entity/account mapping

/risks (RiskAssessments)
  └─ Risk assessment management

/plans (AuditPlans)
  └─ Formal audit planning

/audits (ActiveAuditsList)
  ├─ List all active audit engagements
  └─ /audits/:auditId/workpapers (AuditWorkpapers)
      └─ Workpaper listing for specific audit
```

**Engagement Management** (Primary Workflow)
```
/engagements (EngagementList)
  └─ All active engagements for user

/engagements/:id (EngagementDetail)
  └─ Engagement overview and general details

/engagements/:id/audit (EngagementDetailAudit)
  └─ Audit-specific details and procedures

/engagements/:engagementId/assign-procedures (ProcedureAssignment)
  └─ Assign procedures to engagement team

/engagements/templates (EngagementTemplates)
  └─ Engagement templates library

/engagements/approvals (ApprovalDashboard)
  └─ Review and approve deliverables
```

**Audit Programs & Procedures**
```
/programs (ProgramLibrary)
  └─ Browse and search program templates

/programs/:id (ProgramDetail)
  └─ Detailed view of specific audit program

/procedures (ProcedureLibrary)
  └─ All available audit procedures

/my-procedures (MyProcedures)
  └─ Procedures assigned to logged-in user

/procedures/assign (ProcedureAssignment)
  └─ Assign procedures to audit team
```

**Workpapers**
```
/workpapers (WorkpapersLanding)
  └─ Entry point and navigation hub

/workpapers/:id (WorkpaperEditor)
  └─ Rich text editor with collaboration features
```

**Findings & Evidence**
```
/findings (FindingsManagement)
  └─ Audit findings tracker

/evidence (EvidenceLibrary)
  └─ Evidence document repository
```

**Review & Quality**
```
/review-queue (ProcedureReviewQueue)
  └─ Procedures pending review

/quality-control (QualityControlDashboard)
  └─ Firm-level QC monitoring
```

**Tasks & Requests**
```
/tasks (TaskBoard)
  └─ Personal and engagement tasks

/information-requests (InformationRequests)
  └─ Client information request tracking
```

**Analytics**
```
/analytics (ProgramAnalytics)
  └─ Audit performance and program metrics
```

**Audit Tools** (Specialized Calculators)
```
/tools/materiality (MaterialityCalculatorPage)
  └─ Materiality determination calculator

/tools/sampling (SamplingCalculatorPage)
  └─ Sample size and selection tool

/tools/confirmations (ConfirmationTrackerPage)
  └─ Confirmation procedure tracking

/tools/analytical-procedures (AnalyticalProceduresPage)
  └─ Substantive analytical procedures
```

**Settings & Administration**
```
/settings (Settings)
  └─ User and organization settings

/admin (AdminDashboard)
  └─ Admin dashboard [Requires: partner OR firm_administrator]

/admin/users (UserManagement)
  └─ Manage firm users and roles [Requires: partner OR firm_administrator]
```

#### Route Protection Strategy
```typescript
// RequireAuth - checks authentication only
<Route element={<RequireAuth><AppLayout /></RequireAuth>}>
  {/* All routes within have user logged in */}
</Route>

// RequireRole - checks authentication + specific roles
<Route element={
  <RequireAuth>
    <RequireRole allowedRoles={['partner', 'firm_administrator']}>
      <AppLayout />
    </RequireRole>
  </RequireAuth>
}>
  {/* Only partners and firm admins */}
</Route>
```

#### URL Patterns
- **Singular Resources:** `/engagements/:id`, `/workpapers/:id`
- **Collections:** `/procedures`, `/findings`, `/evidence`
- **Workflow:** `/engagements/:id/assign-procedures`
- **Tools:** `/tools/:toolType`

---

## Component Architecture

### Component File Structure
**Total Components:** 243 component files

### Component Organization

#### 1. **UI Components** (`/src/components/ui/`)
Reusable, unstyled Radix UI primitives wrapped in Tailwind styling

```
Core Inputs:
├─ input.tsx - Text input
├─ textarea.tsx - Multi-line text
├─ select.tsx - Dropdown selection
├─ checkbox.tsx - Boolean toggle
├─ radio-group.tsx - Exclusive selection
├─ slider.tsx - Range selection
├─ toggle.tsx - Button toggle
└─ toggle-group.tsx - Multiple toggles

Display:
├─ card.tsx - Container with border/shadow
├─ badge.tsx - Label/tag
├─ avatar.tsx - User profile picture
├─ status-dot.tsx - Visual status indicator
├─ table.tsx - Data grid
├─ pagination.tsx - Page navigation
└─ breadcrumbs.tsx - Navigation trail

Modals & Overlays:
├─ dialog.tsx - Modal dialog
├─ alert-dialog.tsx - Confirmation
├─ drawer.tsx - Side panel
├─ popover.tsx - Popover menu
├─ hover-card.tsx - Hover tooltip
├─ dropdown-menu.tsx - Context menu
├─ sheet.tsx - Bottom/side drawer
└─ tooltip.tsx - Inline help

Navigation:
├─ sidebar.tsx - App sidebar (collapsible)
├─ navigation-menu.tsx - Top nav
├─ command.tsx - Command palette
├─ command-palette.tsx - Global shortcuts
└─ breadcrumb.tsx - Crumb navigation

Advanced:
├─ virtualized-list.tsx - Large list virtualization
├─ carousel.tsx - Image carousel
├─ chart.tsx - Recharts wrapper
├─ progress.tsx - Progress bar
├─ inline-progress.tsx - Inline progress
├─ sparkline.tsx - Mini trend charts
└─ form.tsx - React Hook Form wrapper
```

#### 2. **Layout Components** (`/src/components/layouts/`)

```
AppLayout.tsx
├─ Main application wrapper
├─ Includes: Sidebar, TopBar, ContentArea
└─ Provides: Layout context

EngagementLayout.tsx
├─ Engagement-specific layout
└─ Navigation focused on engagement

AuditLayout.tsx
├─ Audit execution layout
└─ Program/procedure focused
```

#### 3. **Guard Components** (`/src/components/guards/`)

```
RequireAuth.tsx
├─ Authentication check
├─ Redirects to /auth/login if not authenticated
└─ Prevents unauthorized access

RequireRole.tsx
├─ Role-based access control
├─ Props: allowedRoles: AppRole[]
└─ Shows permission denied if role not present

PermissionGate.tsx
├─ Feature-level permissions
├─ Props: permission: string
└─ Hides component if permission missing
```

#### 4. **Engagement Components** (`/src/components/engagement/`)

```
EngagementCard.tsx
├─ Visual engagement summary
└─ Quick status and key metrics

EngagementForm.tsx
├─ Create/edit engagement
├─ Fields: name, client, type, dates, budget
└─ Form validation with Zod

EngagementTimeline.tsx
├─ Gantt-style timeline
└─ Milestone and phase visualization

EngagementDocuments.tsx
├─ File upload and management
└─ Links documents to engagement

EngagementTeamPanel.tsx
├─ Team member assignment
├─ Role allocation
└─ Hours tracking
```

#### 5. **Audit Components** (`/src/components/audit/`)

**Programs** (`audit/programs/`)
```
ProgramBrowser.tsx - Browse/search programs
ProgramTemplate.tsx - Template display
ProgramAssignment.tsx - Assign program to engagement
ProgramMetrics.tsx - Performance dashboards
```

**Procedures** (`audit/procedures/`)
```
ProcedureCard.tsx - Procedure summary
ProcedureWizard.tsx - Step-by-step execution
ProcedureChecklist.tsx - Task completion tracking
ProcedureDependencies.tsx - Dependency visualization
ProcedureRecommender.tsx - AI-based suggestions
```

**Risk Assessment** (`audit/risk/`)
```
RiskMatrix.tsx - 2D risk plot
RiskAssessmentForm.tsx - Risk questionnaire
RiskHeatMap.tsx - Risk summary visualization
RiskAreaDetail.tsx - Detailed risk analysis
```

**Analytics** (`audit/analytics/`)
```
ProgramCoverageChart.tsx - Procedure execution status
ProcedureEffectivenessChart.tsx - Quality metrics
TimeTracking.tsx - Hour allocation
EngagementMetrics.tsx - KPI dashboards
```

#### 6. **Workpaper Components** (`/src/components/audit/`)

```
WorkpaperEditor.tsx
├─ Rich text editor (Tiptap)
├─ Features: Formatting, mentions, @references
├─ Real-time collaboration
└─ Version history

WorkpaperComments.tsx
├─ Inline review comments
├─ Comment threading
└─ Unresolved issues tracking

WorkpaperSignoff.tsx
├─ Multi-level approval workflow
├─ Status: Not signed, In review, Approved
└─ Audit trail of all signoffs

WorkpaperEvidenceLink.tsx
├─ Attach supporting documents
├─ Evidence strength designation
└─ Reference tracking
```

#### 7. **Audit Tools** (`/src/components/audit-tools/`)

```
MaterialityCalculator.tsx
├─ Benchmark selection (revenue, assets, etc.)
├─ % determination
├─ Calculates performance materiality
└─ Clearly trivial threshold

SamplingCalculator.tsx
├─ Sample size determination
├─ Method selection (statistical, judgmental)
├─ Population characteristics
└─ Risk assessment integration

ConfirmationTracker.tsx
├─ Confirmation management
├─ Status tracking (sent, received, exceptions)
├─ Follow-up automation
└─ Exception reconciliation

AnalyticalProcedures.tsx
├─ Ratio analysis
├─ Trend analysis
├─ Benchmarking
└─ Regression analysis

TrialBalanceAnalyzer.tsx
├─ TB import and validation
├─ Account reconciliation
├─ Adjustment tracking
└─ Account rollforward

BenfordsLawAnalyzer.tsx
├─ Distribution testing
├─ Anomaly detection
└─ Fraud risk assessment
```

#### 8. **Settings Components** (`/src/components/settings/`)

```
OrganizationSettings.tsx
├─ Firm name, logo, contact info
└─ Domain/branding configuration

TeamManagement.tsx
├─ User list with roles
├─ Invite users
└─ Bulk operations

RoleManagement.tsx
├─ Role definitions
├─ Permission matrix
└─ Custom roles (future)

NotificationSettings.tsx
├─ User notification preferences
├─ Email digest configuration
└─ Real-time notification settings

BrandingSettings.tsx
├─ Logo upload
├─ Color scheme
└─ Custom domain setup

LicenseManagement.tsx
├─ Subscription status
├─ Feature access
└─ Billing portal
```

#### 9. **Admin Components** (`/src/components/admin/`)

```
AdminDashboard.tsx
├─ Firm metrics
├─ User activity
├─ Audit performance
└─ System health

UserManagement.tsx
├─ User list with filtering
├─ Bulk role assignment
├─ User suspension/deletion
└─ Impersonation logging

InviteUserDialog.tsx
├─ Email-based invitations
├─ Role pre-selection
└─ Bulk invite (CSV)

ManageUserRolesDialog.tsx
├─ Edit user roles
├─ Firm assignment
└─ Permission customization
```

#### 10. **Shared Components** (`/src/components/shared/`)

```
ConfirmationDialog.tsx
├─ Generic confirmation with danger confirmation
└─ Props: title, description, onConfirm, isDangerous

RelatedFeatures.tsx
├─ Related feature suggestions
└─ Contextual help links

AdvancedSearch.tsx
├─ Multi-field search interface
├─ Filter builder
└─ Saved search persistence

Breadcrumbs.tsx
├─ Dynamic breadcrumb trail
└─ Context-aware navigation
```

#### 11. **Specialized Components**

**Workspace Widgets** (`/components/workspace/`)
```
QuickStatsBar.tsx - Key metrics (active audits, tasks, etc.)
MyEngagementsWidget.tsx - User's active engagements
MyTasksWidget.tsx - Personalized task list
FirmOverviewWidget.tsx - Firm metrics (for managers)
```

**Authentication** (`/components/auth/`)
```
LoginForm.tsx - Email/password login
SignupForm.tsx - New user registration
ForgotPasswordForm.tsx - Password reset
InvitationAccept.tsx - Accept user invitation
```

**Error Handling**
```
ErrorBoundary.tsx
├─ React error boundary
├─ Error logging integration
└─ Graceful error display
```

**Documents** (`/components/documents/`)
```
DocumentUploader.tsx - File upload with validation
DocumentViewer.tsx - Preview support (PDF, images, etc.)
DocumentList.tsx - File browser
```

**Notifications**
```
NotificationsDropdown.tsx
├─ Bell icon with notification list
├─ Mark as read
└─ Quick actions from notifications
```

### Component Naming Conventions

1. **Container vs Presentational:**
   - Containers: `*Page.tsx`, `*Screen.tsx`, `*Container.tsx`
   - Presentational: `*Button.tsx`, `*Card.tsx`, `*Form.tsx`

2. **Naming Pattern:**
   - Domain-specific: `AuditProcedureForm.tsx`
   - Generic helpers: `Button.tsx`, `Card.tsx`
   - Feature-based: `EngagementTimeline.tsx`

3. **File Organization:**
   - Feature-based folders with index.ts for exports
   - UI library in dedicated ui/ folder
   - Shared components in shared/ folder

---

## Hooks & Data Fetching

### Hook File Count
**Total Hooks:** 98 custom hooks

### Data Fetching Hooks by Domain

#### Engagement Hooks
```typescript
// src/hooks/useEngagement.tsx
interface Engagement { /* ... */ }
- getEngagement(id): Engagement
- updateEngagement(id, data)
- listEngagements(filters)

// src/hooks/useEngagementWorkflow.ts
- getEngagementStatus(id): status
- transitionEngagement(id, newStatus, notes)
- trackWorkflowProgress(id): progress
- validateTransition(currentStatus, newStatus)

// src/hooks/useEngagementAcceptance.ts
- startAcceptance(engagementId)
- getChecklistItems(engagementId)
- completeChecklistItem(itemId, notes)
- approveEngagement(engagementId, approverNotes)

// src/hooks/useEngagementTemplates.tsx
- listTemplates(filters)
- createFromTemplate(templateId, engagementData)
- saveAsTemplate(engagementId, templateName)

// src/hooks/useEngagementChangeOrders.tsx
- createChangeOrder(engagementId, changes)
- approveChangeOrder(orderId)
```

#### Procedure & Program Hooks
```typescript
// src/hooks/useProcedures.tsx
- getProcedure(id)
- searchProcedures(query, filters)
- recommendProcedures(context): ProcedureRecommendation[]

// src/hooks/useProcedureWorkflow.ts
- getProcedureStatus(id)
- updateProcedureStatus(id, status)
- trackCompletion(id): completionPercentage
- getDependencies(id): ProcedureDependency[]

// src/hooks/useEngagementProcedures.tsx
- assignProcedures(engagementId, procedureIds)
- updateAssignment(assignmentId, changes)
- getTeamWorkload(engagementId)

// src/hooks/useProgramAnalytics.tsx
- getProgramMetrics(engagementId)
- calculateCoverage(programId)
- getCompletionTrends(timeRange)
```

#### Workpaper Hooks
```typescript
// src/hooks/useWorkpapers.tsx
- getWorkpaper(id): WorkpaperData
- createWorkpaper(workpaperData)
- updateWorkpaper(id, content)
- listWorkpapers(filters)

// src/hooks/useWorkpaperCollaboration.tsx
- subscribeToWorkpaperUpdates(id)
- addComment(workpaperId, comment)
- resolveComment(commentId)
- getCollaborators(workpaperId)

// src/hooks/useProfessionalStandards.ts
- getTickMarkLibrary(): TickMarkDefinition[]
- validateCrossReferences(fromId, toId)
- trackVersionHistory(workpaperId)
- getAuditTrail(workpaperId)
```

#### Risk Assessment Hooks
```typescript
// src/hooks/useRiskAssessment.tsx
- getRiskAssessment(engagementId)
- updateRiskArea(areaId, assessment)
- calculateOverallRisk()
- getRiskMatrix(): HeatMapData

// src/hooks/useComplianceAnalytics.ts
- getComplianceStatus(engagementId)
- trackRequirements(engagementId)
- reportCompliance(reportData)
```

#### Audit Tools Hooks
```typescript
// src/hooks/useMateriality.ts
- calculateMateriality(benchmark, percentage): materialityAmount
- calculatePerformanceMateriality(materiality)
- getClearlyTrivialThreshold(materiality)
- saveMaterialityCalculation(engagementId, calculation)

// src/hooks/useSampling.ts
- calculateSampleSize(populationSize, riskLevel, precision)
- selectSampleItems(population, sampleSize, method)
- stratifyPopulation(population, attribute)
- getStatisticalResults(sample, population)

// src/hooks/useConfirmations.tsx
- createConfirmation(engagementId, confirmationData)
- trackConfirmationStatus(confirmationId)
- recordResponse(confirmationId, responseData)
- reconcileExceptions(confirmationId, exceptions)

// src/hooks/useTrialBalance.ts
- importTrialBalance(file): TrialBalance
- validateAccounts(trialBalance)
- reconcileAccounts(trialBalance, adjustments)
- generateRollforward(trialBalance)

// src/hooks/useBenfordsLawAnalysis.ts
- analyzeBenfordsDistribution(data): Analysis
- detectAnomalies(data): Anomaly[]
- calculateChiSquare(expectedDistribution, actualDistribution)
```

#### Quality Control Hooks
```typescript
// src/hooks/useQualityControl.ts
- getQCWorkpapers(filters)
- assignQCReview(workpaperId, reviewerId)
- submitQCReview(workpaperId, findings)
- trackQCMetrics(firmId, timeRange)

// src/hooks/useControlTesting.ts
- getControls(engagementId): Control[]
- performWalkthrough(controlId, walkthroughData)
- testOperatingEffectiveness(controlId, testData)
- reportControlDeficiency(controlId, deficiency)
```

#### Findings & Evidence Hooks
```typescript
// src/hooks/useFindings.tsx
- createFinding(engagementId, findingData)
- updateFinding(id, changes)
- listFindings(filters)
- categorizeFindings(engagementId)

// src/hooks/useFindingsAnalytics.ts
- getFindingsTrend(timeRange): Trend[]
- compareFindingsYoY(client, years)
- rankFindingsBySeverity(findings)

// src/hooks/useAuditEvidence.tsx (via audit-tools)
- uploadEvidence(file, metadata)
- linkEvidenceToWorkpaper(evidenceId, workpaperId)
- searchEvidence(query)
- getEvidenceChain(workpaperId)
```

#### Reporting Hooks
```typescript
// src/hooks/useAuditReporting.ts
- generateAuditReport(engagementId, options)
- getReportContent(engagementId, section)
- trackReportProgress(engagementId)
- exportReport(engagementId, format) // PDF, Word, etc.

// src/hooks/useGoingConcern.ts
- assessGoingConcern(engagementId)
- documentConcernIndicators(indicators)
- evaluateManagementPlans(plans)
- reachConclusion(engagementId, conclusion)
```

#### Admin & User Hooks
```typescript
// src/hooks/useUsers.tsx
- listUsers(filters)
- updateUserRole(userId, newRole)
- deactivateUser(userId)
- impersonateUser(userId) [with audit trail]

// src/hooks/usePermissions.ts
- getUserPermissions(userId): Permission[]
- checkPermission(userId, permission, resourceId)
- grantPermission(userId, permission)

// src/hooks/useImpersonation.ts
- startImpersonation(userId): impersonationToken
- logImpersonationAccess(token, action)
- endImpersonation()
```

#### Real-time & Sync Hooks
```typescript
// src/hooks/useRealtimeSubscription.ts
- subscribeToTable(tableName, callback)
- subscribeToRow(tableName, id, callback)
- publishMessage(channel, event)
- unsubscribe(subscription)

// src/hooks/useDashboardRealtime.tsx
- subscribeToMetrics(engagementId)
- trackLiveProgress(engagementId)
```

#### Document & File Hooks
```typescript
// src/hooks/useDocumentStorage.ts
- uploadDocument(file, engagement, category)
- getDocuments(engagementId, category)
- shareDocument(documentId, recipientId)
- deleteDocument(documentId)

// src/hooks/useExcelImport.ts
- validateExcelFile(file)
- parseExcelData(file): ParsedData[]
- mapColumns(data, columnMapping)
- importData(data, targetTable)
```

### Hook Architecture Patterns

1. **Data Fetching Pattern:**
```typescript
const useData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('id', id);
      if (error) throw error;
      return data;
    }
  });
  return { data, isLoading, error };
};
```

2. **State Management Pattern:**
```typescript
const useWorkflow = () => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const { mutate } = useMutation({
    mutationFn: updateFn,
    onSuccess: (data) => dispatch({ type: 'UPDATE', payload: data })
  });
  return { state, dispatch, mutate };
};
```

3. **Effect Pattern (Subscriptions):**
```typescript
const useRealtimeData = (id) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    const subscription = supabase
      .from('table')
      .on('*', payload => setData(payload.new))
      .subscribe();
    return () => subscription.unsubscribe();
  }, [id]);
  return data;
};
```

---

## Context & State Management

### Global Contexts (5 core contexts)

#### 1. **AuthContext** (`/src/contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: AppRole[]
  currentOrganization: Organization | null
  organizationId: string | null
  isLoading: boolean
  signIn(email, password): Promise<{error}>
  signUp(email, password, firstName, lastName): Promise<{error}>
  signOut(): Promise<void>
  hasRole(role: AppRole): boolean
  hasPermission(permission: string, resourceType?): Promise<boolean>
}
```

**Purpose:** Authentication state and user identity
**Scope:** Application-wide
**Storage:** Supabase Auth session + custom profile data

#### 2. **TenantContext** (`/src/contexts/TenantContext.tsx`)

```typescript
interface TenantContextValue {
  firmId: string | null
  firmSlug: string | null
  firmName: string | null
  logoUrl: string | null
  primaryColor: string | null
  portalType: 'admin' | 'app' | 'client'
  isCustomDomain: boolean
  hostname: string
  isLoading: boolean
  error: string | null
  refetchTenant(): Promise<void>
}
```

**Purpose:** Multi-tenant detection and firm context
**Scope:** Application-wide
**Logic:** 
- Detects firm from subdomain (e.g., `acmecorp.auditapp.com`) or custom domain
- Loads firm branding (logo, colors) and applies to theme
- Distinguishes between platform admin, internal app, and client portal

#### 3. **PlatformContext** (`/src/contexts/PlatformContext.tsx`)

```typescript
interface PlatformContextType {
  isPlatformAdmin: boolean
  featureFlags: Record<string, boolean>
  systemHealth: SystemHealth
  version: string
  notificationChannels: NotificationChannel[]
}
```

**Purpose:** Platform-level configuration and feature management
**Scope:** Application-wide
**Usage:** Feature flags, system status, admin-only features

#### 4. **OrganizationContext** (`/src/contexts/OrganizationContext.tsx`)

```typescript
interface OrganizationContextType {
  organization: Organization | null
  settings: OrganizationSettings
  permissions: Permission[]
  roles: CustomRole[]
  updateSettings(changes): Promise<void>
}
```

**Purpose:** Organization/firm-level settings
**Scope:** Within firm context
**Storage:** `firms` and `firm_settings` tables

### State Management Patterns

#### Query Client (TanStack React Query)
Handles server state with caching, background sync, and mutations:

```typescript
const queryClient = new QueryClient();

// In App.tsx root:
<QueryClientProvider client={queryClient}>
  {/* All components can use useQuery and useMutation */}
</QueryClientProvider>
```

#### Redux-like State Machines (Advanced Workflows)
For complex workflows like engagement lifecycle:

```typescript
// src/lib/state-machines/engagementStateMachine.ts
export const engagementStateMachine = {
  draft: {
    accept: 'pending_review',
    decline: 'declined'
  },
  pending_review: {
    approve: 'accepted',
    request_changes: 'draft'
  },
  accepted: {
    start: 'in_progress',
    cancel: 'cancelled'
  },
  in_progress: {
    complete: 'complete',
    on_hold: 'on_hold'
  },
  on_hold: {
    resume: 'in_progress',
    cancel: 'cancelled'
  }
}
```

#### Local Component State
For UI-only state (modals, forms, filters):
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState(initialData);
const [filters, setFilters] = useState({});
```

### Data Fetching Patterns

#### Server State (Supabase + React Query)
```typescript
// Query
const { data: engagements } = useQuery({
  queryKey: ['engagements', filters],
  queryFn: () => supabase
    .from('engagements')
    .select('*')
    .match(filters)
});

// Mutation
const { mutate: updateEngagement } = useMutation({
  mutationFn: (data) => supabase
    .from('engagements')
    .update(data)
    .eq('id', data.id),
  onSuccess: () => queryClient.invalidateQueries(['engagements'])
});
```

#### Real-time Subscriptions
```typescript
useEffect(() => {
  const subscription = supabase
    .from('workpapers')
    .on('UPDATE', payload => {
      // Handle real-time updates
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [workpaperId]);
```

### RLS (Row-Level Security) & Authentication

Supabase RLS policies enforce tenant isolation at database level:

```sql
-- Example: Users can only see their firm's data
CREATE POLICY "Users see own firm data" ON engagements
  AS SELECT
  USING (firm_id = auth.jwt() ->> 'firm_id');

-- Example: Some data is public (programs)
CREATE POLICY "Public programs" ON audit_programs
  AS SELECT
  USING (is_public = true OR firm_id = auth.jwt() ->> 'firm_id');
```

---

## Technology Stack

### Frontend Framework
- **React** 18.3.1 - UI library
- **TypeScript** 5.8.3 - Type safety
- **Vite** 5.4.19 - Build tool
- **React Router** 6.30.1 - Client-side routing

### State Management & Data
- **TanStack React Query** 5.83.0 - Server state management
- **React Hook Form** 7.61.1 - Form state management
- **Zustand** (implied) - Global state
- **Supabase** 2.79.0 - Backend-as-a-service

### UI Components & Styling
- **Radix UI** - Headless component library
  - @radix-ui/react-*: All primitive components
- **Tailwind CSS** 3.4.17 - Utility-first styling
- **lucide-react** 0.462.0 - Icon library
- **shadcn/ui** - Pre-styled components
- **Framer Motion** 12.23.24 - Animation library

### Specialized Libraries
- **TipTap** 3.10.5 - Rich text editor
  - Extensions: mention, placeholder, starter-kit
- **Recharts** 2.15.4 - Data visualization
- **XLSX** 0.18.5 - Excel import/export
- **jsPDF** 3.0.3 - PDF generation
- **html2canvas** 1.4.1 - Screenshot functionality
- **Sonner** 1.7.4 - Toast notifications
- **date-fns** 4.1.0 - Date utilities
- **zod** 3.25.76 - Schema validation
- **cmdk** 1.1.1 - Command palette
- **Fuse.js** 7.1.0 - Fuzzy search

### Development Tools
- **ESLint** 9.32.0 - Code linting
- **Prettier** 3.2.0 - Code formatting
- **Vitest** 1.3.0 - Unit testing
- **TypeScript ESLint** 8.38.0 - TS linting
- **Husky** 9.0.0 - Git hooks
- **lint-staged** 15.2.0 - Staged linting

### Browser Support
- Modern browsers (Chromium, Firefox, Safari)
- Vue3+ features required

---

## Architectural Patterns

### 1. **Multi-Tenant Architecture**

**Firm Isolation:**
- Every user belongs to exactly one `firm` (organization)
- Every data row contains `firm_id` for scoping
- RLS policies at database enforce tenant isolation
- TenantContext provides firm context throughout app

**Implementation:**
```typescript
// AuthContext sets firm_id on login
const { data: profile } = await supabase
  .from('profiles')
  .select('firm_id, roles')
  .eq('id', user.id);

// All queries include firm_id filter
const { data } = await supabase
  .from('engagements')
  .select('*')
  .eq('firm_id', currentOrganization.id);
```

### 2. **Role-Based Access Control (RBAC)**

**Role Hierarchy:**
```
partner
├─ firm_administrator
├─ practice_leader
├─ engagement_manager
│  └─ senior_auditor
│     └─ staff_auditor
├─ business_development
├─ quality_control_reviewer
├─ client_administrator (external)
└─ client_user (external)
```

**Implementation:**
```typescript
// Check role
if (hasRole('partner')) {
  // Show admin features
}

// Require role for route
<RequireRole allowedRoles={['partner', 'firm_administrator']}>
  <AdminDashboard />
</RequireRole>

// Permission-based (more granular)
const canApproveDeliverable = await hasPermission(
  'approve_deliverable',
  'deliverable'
);
```

### 3. **Engagement-Centric Design**

All work flows through engagement context:

```
Engagement (root container)
├─ Procedures (what to audit)
├─ Risk Assessment (how risky is it)
├─ Programs (audit approach)
├─ Workpapers (evidence collection)
├─ Findings (exceptions identified)
├─ Evidence (supporting documentation)
└─ Team (who is involved)
```

Navigation emphasizes engagement over module:
- Primary path: `/engagements/:id`
- Secondary paths: `/engagements/:id/procedures`, `/engagements/:id/audit`
- Tools accessed from engagement context

### 4. **Procedure-Driven Workflow**

Audit execution centers on procedures:

```
1. Select Program (defines procedures)
   ↓
2. Assign Procedures to team members
   ↓
3. Execute Procedures (workpaper creation)
   ↓
4. Review (QC and senior review)
   ↓
5. Approve & Complete
   ↓
6. Report findings
```

**State Machine:**
```
not_started → in_progress → in_review → complete
    ↓            ↓            ↓          ↓
    └── not_applicable ← requires_revision ←─┘
```

### 5. **Quality Control Gates**

Multiple approval layers:

```
Workpaper Completion
    ↓
In-Charge Review (senior_auditor)
    ↓
Engagement Review (manager level)
    ↓
Partner Review (partner level)
    ↓
QC Review (quality_control_reviewer, independent)
    ↓
Final Approval (partner)
```

### 6. **Professional Standards Compliance**

Built-in audit standards (AU-C, ISA, etc.):

- **Tick Marks:** Industry-standard annotation symbols
- **Cross-References:** Link workpapers to evidence
- **Evidence Chain:** Document proof of audit procedures
- **Audit Trail:** Immutable log of all changes
- **Sign-offs:** Multi-level approval workflow
- **Version Control:** Track workpaper evolution

### 7. **Form-Based Data Entry**

Consistent form patterns using React Hook Form + Zod:

```typescript
const schema = z.object({
  name: z.string().min(1),
  budget: z.number().positive(),
  startDate: z.date()
});

const form = useForm({ resolver: zodResolver(schema) });
```

Benefits:
- Type-safe validation
- Automatic error messages
- Submit handling
- Reset functionality

### 8. **Modal-First UI Patterns**

For secondary workflows:
- Create new items: Modal form
- Edit items: Modal form or detail panel
- Confirm actions: Alert dialog
- Multi-step: Wizard dialog

### 9. **Search & Filter Architecture**

Consistent search patterns:

```
Global Search (cmd+k)
├─ Engagements
├─ Procedures
├─ Workpapers
├─ Findings
└─ Team members

Feature-Specific Filters
├─ Status
├─ Assignee
├─ Date Range
├─ Severity/Risk Level
└─ Custom fields
```

### 10. **Error Handling Strategy**

Layered error handling:

```typescript
// API level
try {
  const { data, error } = await supabase...
  if (error) throw new AuditError(error.message)
} catch (err) {
  logError(err)  // Sentry
  showToast(err.message)
}

// Component level
<ErrorBoundary>
  <Component />
</ErrorBoundary>

// Async operation level
useMutation({
  onError: (error) => showToast(error.message)
})
```

### 11. **Real-Time Collaboration**

For workpaper editing:

```typescript
// Subscribe to changes
useEffect(() => {
  const subscription = supabase
    .from('audit_workpapers')
    .on('UPDATE', (payload) => {
      // Another user edited
      updateLocal(payload.new)
    })
    .subscribe()
})

// Conflict resolution: Last-write-wins or version merging
```

### 12. **Mobile Responsiveness**

Responsive design patterns:

```typescript
// Hidden on mobile
<div className="hidden md:block">Desktop</div>

// Mobile menu
<Sheet> {/* Mobile sidebar */} </Sheet>

// Touch-friendly
<Button className="py-3 px-4"> {/* Larger touch targets */}
```

### 13. **Accessibility (a11y)**

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation
- Focus management
- Color contrast compliance
- Screen reader support

### 14. **Performance Optimization**

- **Code splitting:** Lazy-loaded routes
- **Image optimization:** Next-gen formats
- **Virtual scrolling:** For large lists
- **Query caching:** React Query deduplication
- **Debouncing:** Search and filter inputs
- **Memoization:** useMemo, useCallback for expensive computations

### 15. **Testing Strategy**

- **Unit tests:** Individual functions and hooks
- **Component tests:** UI behavior with @testing-library
- **Integration tests:** Feature workflows
- **E2E tests:** Critical user paths (future)

Test files follow component location: `Component.test.tsx`

---

## Key Conventions & Best Practices

### Import Paths
```typescript
// Use @ alias for src/ directory
import { Button } from '@/components/ui/button'
import { useEngagement } from '@/hooks/useEngagement'
import { authContext } from '@/contexts/AuthContext'
```

### File Organization
```
src/
├─ components/       # React components (243 files)
├─ contexts/         # Global state (4 files)
├─ hooks/            # Custom hooks (98 files)
├─ pages/            # Route pages (38 files)
├─ lib/              # Utilities and services
├─ types/            # TypeScript definitions
├─ integrations/     # External service clients (Supabase)
├─ shared/           # Shared modules (services, types)
└─ App.tsx           # Root component
```

### Type Safety
- Strict TypeScript: `noImplicitAny: true`
- Database types auto-generated from Supabase schema
- Form schemas with Zod
- Custom domain types in `/src/types/`

### Form Validation
```typescript
// Always use Zod schemas
const schema = z.object({
  field: z.string().min(1, "Required")
})

// With React Hook Form
const form = useForm({ resolver: zodResolver(schema) })
```

### Styling
- Tailwind CSS utility classes (no custom CSS files)
- Consistent spacing (4px grid): `p-4`, `mb-6`, `gap-3`
- Semantic color names: `bg-background`, `text-foreground`, `border-border`
- Component variants via `className` or custom props

### Mutations & Side Effects
```typescript
const { mutate } = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase...
    if (error) throw error
    return data
  },
  onSuccess: () => {
    showToast("Success!")
    queryClient.invalidateQueries(['key'])
  },
  onError: (error) => {
    showToast(error.message)
  }
})
```

---

## Summary

The Obsidian Audit Platform is a comprehensive **enterprise audit execution engine** built with modern React architecture and best practices:

**Key Strengths:**
- Multi-tenant design with firm-level isolation
- Professional standards compliance built-in (AU-C, ISA)
- Engagement-centric workflow matching real audit processes
- Rich tooling (materiality, sampling, trial balance analysis)
- Real-time collaboration on workpapers
- Strong access control (RBAC + RLS)
- Comprehensive audit lifecycle coverage

**Architecture Highlights:**
- 150+ database tables for audit-specific data
- 38 page routes covering all audit functions
- 243 reusable React components
- 98 custom hooks for data operations
- 4 global contexts for state management
- TanStack Query for server state
- Supabase for backend & auth

**Development Practices:**
- Type-safe TypeScript throughout
- Form validation with Zod
- Component-based UI with Radix/Tailwind
- Test coverage with Vitest
- Linting & formatting with ESLint/Prettier
- Git hooks with Husky

This architecture supports both small and large audit firms with comprehensive engagement management, procedure execution, evidence collection, quality control, and reporting capabilities.

