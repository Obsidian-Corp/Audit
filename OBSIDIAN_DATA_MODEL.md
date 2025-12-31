# Obsidian Audit Platform - Comprehensive Data Model

## Overview

Obsidian is an enterprise audit management platform built on TypeScript/React frontend with Supabase PostgreSQL backend. The system follows a multi-tenant, role-based architecture supporting financial auditing workflows, risk assessment, audit procedures, findings management, and audit reporting.

---

## 1. ORGANIZATIONAL & ACCESS CONTROL LAYER

### 1.1 Organizations
**Purpose:** Multi-tenant isolation and organizational isolation

**Key Fields:**
- `id` - UUID primary key
- `name` - Organization name
- `slug` - Unique URL-friendly identifier
- `logo_url` - Organization branding
- `primary_color` - Brand color theme
- `status` - 'active', 'suspended', 'archived'
- `sso_enabled` - Single Sign-On capability
- `mfa_required` - Multi-factor authentication requirement
- `data_region` - Data residency/compliance region
- `metadata` - JSONB for extensible attributes
- `created_at`, `updated_at` - Audit timestamps

**Relationships:**
- One-to-Many: Organization Members, User Roles, Audit Logs, Audit Entities, Risk Assessments, Audit Plans, Audits
- RLS Enforced: Only organization members can view

**Lifecycle:**
- Status: active → suspended → archived
- Immutable once created (ID generation at creation)

---

### 1.2 User Roles & Permissions
**Purpose:** Role-based access control with granular permissions

**User Roles Table:**
- `id`, `user_id`, `organization_id`, `role`, `project_id`, `assigned_by`, `assigned_at`
- Roles: `org_admin`, `project_manager`, `internal_contributor`, `client_executive`, `client_contributor`, `external_vendor`, `auditor`, `read_only`
- Project-scoped or org-wide roles

**Permissions Table:**
- `permission_type` - Enum of 22+ permissions (org.manage, project.create, audit.view, etc.)
- `description` - Permission documentation

**Role Permissions Mapping:**
- `role` → `permission_type` relationship
- Seeded with default mappings per role
- Org Admin has full permissions
- Auditor has audit.view + task.view + project.view

**Access Control Functions:**
- `has_role(user_id, org_id, role)` - Check specific role
- `is_org_member(user_id, org_id)` - Check membership
- `has_permission(user_id, org_id, permission)` - Check via role hierarchy
- `get_user_primary_org(user_id)` - Find default org

**Relationships:**
- One-to-Many: User Roles → Users, Organizations
- Many-to-Many: Roles ↔ Permissions

---

### 1.3 Organization Members
**Purpose:** Track user membership and invitations

**Key Fields:**
- `id`, `user_id`, `organization_id`, `invited_by`, `invited_at`
- `status` - 'active', 'suspended', 'removed'

**Relationships:**
- References: Users, Organizations
- Uniqueness: user_id + organization_id

---

### 1.4 Audit Logs
**Purpose:** Comprehensive audit trail for compliance (SOX, GDPR)

**Key Fields:**
- `id`, `created_at`, `user_id`, `organization_id`
- `action` - Type of action performed
- `resource_type`, `resource_id` - What was affected
- `ip_address`, `user_agent` - Request metadata
- `metadata` - JSONB for rich context

**Indexes:**
- (organization_id, created_at DESC) - Primary query
- (user_id, created_at DESC) - User activity timeline
- (resource_type, resource_id) - Resource-specific queries

**Usage:** Security monitoring, compliance reporting, forensic analysis

---

## 2. AUDIT MANAGEMENT CORE

### 2.1 Audit Entities (Audit Universe)
**Purpose:** Define what can be audited (departments, processes, accounts, systems)

**Key Fields:**
- `id`, `organization_id`, `entity_code`, `entity_name`
- `entity_type` - 'department', 'process', 'account', 'system'
- `description`, `parent_entity_id` - Hierarchical structure
- `risk_score` - 0-100 scale for audit prioritization
- `last_audit_date`, `next_audit_date` - Scheduling
- `audit_frequency` - 'quarterly', 'annual', 'biannual'
- `status` - 'active', 'inactive', 'archived'

**Relationships:**
- Parent-child hierarchy: References self via parent_entity_id
- References: Organization

**Business Rules:**
- Unique: (organization_id, entity_code)
- Risk score updated as assessments completed
- Automatic scheduling based on frequency

**Usage:** Audit planning, risk assessment scope

---

### 2.2 Risk Assessments
**Purpose:** Entity-level risk evaluation for audit planning

**Key Fields:**
- `id`, `organization_id`, `entity_id`, `assessment_date`
- `likelihood_score` (1-5), `impact_score` (1-5)
- `inherent_risk` - GENERATED: likelihood × impact × 4.0
- `control_effectiveness` (1-5)
- `residual_risk` - Calculated post-mitigation
- `risk_category` - 'financial', 'operational', 'compliance', 'strategic'
- `risk_description`, `mitigation_strategy`
- `assessed_by`, `reviewed_by`, `review_date`
- `status` - 'draft', 'submitted', 'approved'

**Related Types (TypeScript):**

**EngagementRiskAssessment:**
- Engagement-level assessment
- `overall_risk_rating`, `fraud_risk_rating`, `it_dependency_rating`
- `engagement_type` - 'first_year', 'recurring', 'special_purpose'
- `prior_year_opinion` - Clean/Qualified/Adverse/Disclaimer/N/A
- `years_as_client`
- Version tracking: `version`, `is_current`

**RiskAreaAssessment:**
- Granular risk assessment per audit area
- `area_name`, `area_category` - 'balance_sheet', 'income_statement', 'control_environment', 'other'
- `inherent_risk`, `control_risk`, `combined_risk`
- `fraud_risk_factors` - Array of applicable fraud risks
- `materiality_threshold`, `is_material_area`
- `recommended_approach` - 'substantive', 'controls_reliance', 'combined'
- `recommended_testing_level` - 'minimal', 'standard', 'enhanced', 'extensive'

**FraudRiskAssessment (Fraud Triangle):**
- `overall_fraud_risk`
- `fraud_factors` - Categorized as 'incentive', 'opportunity', 'rationalization'
- `specific_fraud_risks` - Array of identified risks
- `fraud_procedures_required`

**ITRiskAssessment:**
- `overall_it_dependency`
- `systems[]` - Array of critical systems
- `control_environment_rating`, `cybersecurity_risk`, `data_integrity_risk`
- `it_general_controls_tested`

**Relationships:**
- References: Organization, AuditEntity
- Assessed by / Reviewed by: User profiles

**Lifecycle:**
- Status: draft → submitted → approved
- Immutable after approval (create new version)
- Multiple versions per engagement

---

### 2.3 Audit Plans
**Purpose:** Period-based planning (annual, quarterly) across multiple audits

**Key Fields:**
- `id`, `organization_id`, `plan_name`, `plan_year`
- `plan_period` - 'Q1', 'Q2', 'Q3', 'Q4', 'Annual'
- `start_date`, `end_date`
- `total_budget`, `allocated_hours` - Resource planning
- `status` - 'draft', 'approved', 'in_progress', 'completed'
- `approved_by`, `approved_at` - Approval workflow
- `created_by`, `created_at`, `updated_at`

**Relationships:**
- One-to-Many: Plan → Audits (one plan contains many audits)

**Usage:** Strategic resource allocation, period-based tracking

---

### 2.4 Audits (Engagements)
**Purpose:** Individual audit execution (maps to 'engagement' concept in TypeScript types)

**Key Fields:**
- `id`, `organization_id`, `audit_plan_id`
- `audit_number` - Human-readable identifier (unique per org)
- `audit_title`, `audit_type` - 'financial', 'operational', 'compliance', 'it', 'integrated'
- `entity_id` - References AuditEntity
- `objective`, `scope`
- `planned_start_date`, `planned_end_date`
- `actual_start_date`, `actual_end_date`
- `status` - 'planned', 'in_preparation', 'fieldwork', 'reporting', 'closed'
- `priority` - 'low', 'medium', 'high', 'critical'
- `budget_allocated`, `budget_spent`
- `hours_allocated`, `hours_spent`
- `lead_auditor_id`, `manager_id` - Assignment
- `risk_rating` - 'low', 'medium', 'high', 'critical'
- `compliance_standards[]` - SOX, IFRS, GAAP, GDPR, ISO27001
- `metadata` - JSONB for custom fields
- `created_by`, `created_at`, `updated_at`

**Enhanced Fields (from engagement_*, audit_* tables):**
- `opportunity_id` - CRM integration (sales pipeline → engagement)
- Related: communications, deliverables, documents, letters, calendar_events, budget_forecasts

**Relationships:**
- Audit Plan (parent), Audit Entity (scoped entity)
- One-to-Many: Audit → Programs, Workpapers, Evidence, Findings, Reports
- One-to-Many: Audit → Team Members, Documents, Deliverables, Communications

**Lifecycle:**
```
planned → in_preparation → fieldwork → reporting → closed
```

**Status Definitions:**
- `planned`: Scheduled, resources allocated
- `in_preparation`: Planning phase, programs/procedures designed
- `fieldwork`: Active testing and evidence collection
- `reporting`: Findings documented, report preparation
- `closed`: Final report issued, engagement complete

---

### 2.5 Audit Team Members
**Purpose:** Track auditor assignments and allocation

**Key Fields:**
- `id`, `audit_id`, `user_id`
- `role` - 'lead_auditor', 'senior_auditor', 'auditor', 'specialist'
- `allocated_hours` - Planned effort
- `assigned_date`

**Relationships:**
- References: Audit, User profiles
- Uniqueness: (audit_id, user_id)

**Usage:** Resource planning, team composition, workpaper assignment

---

## 3. AUDIT EXECUTION & PROCEDURES

### 3.1 Audit Programs
**Purpose:** Structured testing programs (test plans) within an audit

**Key Fields:**
- `id`, `audit_id`, `organization_id`
- `program_name`, `program_type` - 'standard', 'custom', 'template'
- `control_objective` - What control is being tested
- `test_procedures` - JSONB array of procedural steps
- `sample_size`, `sampling_method` - 'random', 'systematic', 'judgmental', 'stratified'
- `assigned_to` - Auditor responsible
- `due_date`
- `status` - 'not_started', 'in_progress', 'completed', 'reviewed'
- `completion_percentage` - 0-100

**Relationships:**
- References: Audit, Organization
- One-to-Many: Program → Workpapers

---

### 3.2 Audit Procedures (Template)
**Purpose:** Reusable procedure definitions with risk-based parameters

**Key Fields:**
- `id`, `firm_id`, `procedure_code`, `procedure_name`
- `category` - Categorization for organization
- `objective`, `instructions` - JSONB for rich content
- `sample_size_guidance`, `evidence_requirements[]`
- `expected_outcomes`, `estimated_hours`
- `risk_level` - General classification
- `control_objectives[]` - What controls it tests
- `procedure_type` - 'standard', 'custom'
- `is_active`

**Enhanced Fields (Risk Intelligence):**
- `applicable_risk_levels[]` - Triggers (low, medium, high, significant)
- `applicable_industries[]` - Industry-specific procedures
- `trigger_conditions[]` - Automation rules (risk scoring triggers)
- `risk_area_tags[]` - For filtering
- `procedure_rationale` - Why procedure is needed
- `dynamic_parameters` - Parameterization by risk level:
  - `low_risk`, `medium_risk`, `high_risk`, `significant_risk`
  - Each specifies: sample_size, depth, estimated_hours, additional_guidance

**Related Types:**
- **ProcedureRiskMapping:** Links procedures to risk areas with priority/adjustments
- **ProcedureRecommendation:** System-generated recommendations based on risk assessment
  - `procedure`, `recommendation_reason`, `is_auto_recommended`
  - `risk_areas[]`, `priority` ('required', 'recommended', 'optional')
  - `adjusted_sample_size`, `adjusted_hours`, `depth_guidance`
  - `coverage_percentage`, `is_industry_specific`

---

### 3.3 Engagement Procedures
**Purpose:** Instance of procedure within specific engagement (instance of template)

**Key Fields:**
- `id`, `engagement_program_id`, `procedure_id`, `engagement_id`
- `assigned_to`, `assigned_by` - Team assignment
- `procedure_name`, `procedure_code`, `instructions` - Can be customized
- `estimated_hours`, `actual_hours`
- `due_date`, `started_at`, `completed_at`
- `status` - 'not_started', 'in_progress', 'in_review', 'complete', 'not_applicable'
- `priority` - 'low', 'medium', 'high'
- `dependencies[]` - Other procedures (sequencing)
- `sequence_order` - Position in program
- `workpaper_id` - Linked workpaper
- `evidence_collected[]` - Evidence file references
- `exceptions_noted`, `conclusion` - Findings/results
- `review_status` - 'pending_review', 'reviewed', 'approved', 'requires_revision'
- `reviewed_by`, `reviewed_at`, `review_notes`
- `quality_score` - 1-5 rating

**Related Types:**
- **ProcedureWorkspace:** Complete execution context
  - Includes: procedure, steps, workpaper, evidence, review_notes, time_entries, related_procedures
- **ProcedureStep:** Individual step completion tracking
- **ReviewNote:** Procedure-level review comments

**Relationships:**
- References: Procedure (template), Engagement Program, Audit
- One-to-Many: EngagementProcedure → Evidence, Review Notes, Time Entries
- One-to-One: EngagementProcedure → Workpaper

**Lifecycle:**
```
not_started → in_progress → in_review → complete
or
not_applicable (conditional procedures)
```

---

### 3.4 Audit Workpapers
**Purpose:** Documentation of testing and supporting evidence

**Key Fields:**
- `id`, `audit_id`, `program_id`, `organization_id`
- `reference_number` - Audit reference (e.g., "A.1.1")
- `title`, `workpaper_type` - 'testing', 'analysis', 'documentation', 'memo'
- `content` - JSONB structured data
- `prepared_by`, `prepared_date`
- `reviewed_by`, `reviewed_date`
- `status` - 'draft', 'review', 'approved'
- `attachments` - JSONB array of file references

**Enhanced Fields (from templates):**
- Workpaper templates define structure
- **WorkpaperTemplate:** Reusable formats with:
  - `template_name`, `description`
  - `workpaper_type`
  - `default_content` - JSONB structure
  - `field_definitions[]` - Metadata about fields
  - `calculation_rules` - Formulas for auto-calculation

**Related Types:**
- **WorkpaperData:** Template instantiation
  - `workpaper_id`, `template_id`, `template_name`
  - `workpaper_data` - JSONB instance
  - `calculated_fields` - Computed values
  - `exceptions[]` - Noted deviations
  - `tick_marks[]` - Audit marks (symbols + meanings)

**Relationships:**
- References: Audit, Program, Organization
- One-to-Many: Workpaper → Evidence, Comments
- One-to-One: Workpaper → Template

**Sign-off Workflow:**
- **WorkpaperSignoffs:** Multi-level approvals
  - Roles: 'preparer', 'reviewer', 'manager', 'partner'
  - Status: 'pending', 'completed', 'not_required'
  - Tracks: hours_worked, comments, signed_date

---

### 3.5 Audit Evidence
**Purpose:** Supporting documentation for audit procedures

**Key Fields:**
- `id`, `audit_id`, `workpaper_id`, `organization_id`
- `evidence_number` - Reference
- `evidence_type` - 'document', 'photo', 'screenshot', 'interview', 'observation', 'calculation'
- `title`, `description`
- `source` - Origin (e.g., "Client CFO")
- `collection_method` - 'inquiry', 'inspection', 'observation', 'recalculation'
- `storage_path`, `file_size`, `mime_type`
- `collected_by`, `collected_date`
- `verified_by`, `verification_date`
- `metadata` - JSONB for evidence attributes

**Relationships:**
- References: Audit, Workpaper, Organization
- Collected by / Verified by: User profiles

**Usage:** Supporting audit conclusions, compliance evidence

---

## 4. FINDINGS & ISSUES MANAGEMENT

### 4.1 Audit Findings
**Purpose:** Record control deficiencies, misstatements, and observations

**Database Schema:**
- `id`, `audit_id`, `organization_id`
- `finding_number` - Reference (unique per audit)
- `finding_title`, `finding_type` - 'deficiency', 'observation', 'recommendation', 'non_compliance'
- `severity` - 'low', 'medium', 'high', 'critical'
- `risk_rating` - 'low', 'moderate', 'significant', 'material_weakness'
- `condition_description` - What was found
- `criteria` - What should be (standard/control)
- `cause` - Root cause
- `effect` - Business impact
- `recommendation` - Corrective action
- `management_response`, `corrective_action_plan`
- `responsible_party`, `target_completion_date`, `actual_completion_date`
- `status` - 'open', 'in_progress', 'resolved', 'closed', 'accepted_risk'
- `repeat_finding`, `previous_finding_id` - Prior year tracking
- `financial_impact` - Quantified amount
- `identified_by`, `identified_date`
- `reviewed_by`, `reviewed_date`
- `closed_by`, `closed_date`

**TypeScript Types (AuditFinding):**
- `finding_description`, `quantified_amount`
- `materiality_impact` - 'none', 'below_trivial', 'below_performance', 'performance', 'planning'
- `affected_accounts[]`, `affected_areas[]`
- `requires_follow_up`, `follow_up_procedures[]`
- `resolved_date`, `resolution_notes`

**Lifecycle:**
```
open → in_remediation/in_progress → resolved → cleared
or
accepted_risk (risk tolerance decision)
```

**Relationships:**
- References: Audit, Organization
- One-to-Many: Finding → Follow-ups, Evidence, Comments, Linkages
- Self-reference: Repeat findings → Prior finding

---

### 4.2 Finding Linkages
**Purpose:** Track relationships between findings and procedures

**Types:**
- `LinkageType` - 'originated_from', 'impacts', 'triggers_follow_up', 'related'
- `LinkageStatus` - 'active', 'resolved', 'not_applicable'

**Fields:**
- `id`, `finding_id`, `procedure_id`, `engagement_procedure_id`
- `linkage_type`, `impact_description`
- `requires_expanded_testing`, `expanded_testing_details`
- `linkage_status`
- `linked_by`, `created_at`, `updated_at`

**Usage:** Procedure re-evaluation based on findings

---

### 4.3 Finding Follow-ups
**Purpose:** Track remediation progress

**Key Fields:**
- `id`, `finding_id`, `follow_up_date`
- `follow_up_type` - 'progress_update', 'evidence_review', 'verification'
- `comments`, `status_update`
- `completion_percentage` (0-100)
- `performed_by`

**Lifecycle:**
- Planned follow-up dates
- Periodic updates with evidence
- Completion verification

---

### 4.4 Finding Analytics
**Purpose:** Comprehensive finding metrics and dashboards

**FindingStatistics:**
- `total_findings`, `open_findings`, `material_findings`
- `control_deficiencies`, `avg_resolution_days`
- `findings_by_severity{}`, `findings_by_type{}`
- `findings_by_area{}`

**FindingDashboardData:**
- Statistics, recent findings, high-priority findings
- Findings by area summary
- Materiality impact distribution
- Resolution timeline

**MaterialityAssessment:**
- `materiality_impact`, `quantified_amount`
- Planning/performance materiality thresholds
- Comparison: exceeds_planning, exceeds_performance, exceeds_trivial

---

## 5. MATERIALITY & RISK PARAMETERS

### 5.1 Materiality Calculation
**Purpose:** Calculate materiality thresholds for audit procedures

**Key Fields:**
- `id`, `engagement_id`, `firm_id`
- `benchmark_type` - 'revenue', 'total_assets', 'net_income', 'equity', 'expenses'
- `benchmark_value`, `benchmark_year`
- `overall_materiality_percentage`, `overall_materiality`
- `performance_materiality_percentage`, `performance_materiality`
- `clearly_trivial_percentage`, `clearly_trivial_threshold`
- `component_materiality` - Group audit components
- `benchmark_rationale`, `percentage_rationale`
- `industry`, `risk_level` - 'low', 'medium', 'high'
- `approved_by`, `approved_at`
- `version`, `is_current`

**Materiality Impact Hierarchy:**
```
none
├─ below_trivial (< clearly trivial threshold)
├─ below_performance (< performance materiality)
├─ performance (>= performance, < overall)
└─ planning (>= overall materiality)
```

**Relationships:**
- References: Engagement, Firm
- Used for: Finding classification, sampling decisions

---

## 6. ENGAGEMENT MANAGEMENT

### 6.1 Engagement Scope & Planning
**Purpose:** Detailed engagement planning and scope management

**Tables:**
- **engagement_milestones** - Key dates and deliverables
- **engagement_scope** - Detailed scope boundaries
- **engagement_change_orders** - Scope changes and approvals
- **engagement_templates** - Engagement type templates

**Key Fields (Scope):**
- `id`, `engagement_id`, `firm_id`
- `scope_description`
- `included_areas[]`, `excluded_areas[]`
- `key_assumption[]`
- `limitation[]`

**Key Fields (Milestones):**
- `id`, `engagement_id`
- `milestone_name`, `milestone_type` - 'planning', 'fieldwork', 'review', 'reporting'
- `planned_date`, `actual_date`
- `deliverable_id` - Linked output
- `status` - 'pending', 'in_progress', 'completed', 'at_risk'

---

### 6.2 Engagement Communications & Documents
**Purpose:** Track all engagement interactions and deliverables

**engagement_communications:**
- `id`, `engagement_id`, `firm_id`
- `communication_type` - 'meeting', 'email', 'phone_call', 'status_update', 'decision'
- `subject`, `summary`
- `participants` - JSONB attendee list
- `communication_date`, `duration_minutes`
- `action_items[]`, `decisions_made[]`
- `next_steps`

**engagement_deliverables:**
- `id`, `engagement_id`, `firm_id`
- `deliverable_name`, `deliverable_type` - 'report', 'letter', 'presentation', 'workpaper', 'recommendation', 'other'
- `description`, `due_date`, `delivered_date`
- `status` - 'pending', 'in_progress', 'review', 'delivered', 'accepted', 'rejected'
- `assigned_to`, `reviewed_by` - Ownership
- `client_accepted_by`, `client_accepted_at`
- `rejection_reason`, `file_url`
- `version`, `parent_deliverable_id` - Versioning & hierarchy

**engagement_documents:**
- `id`, `engagement_id`, `firm_id`
- `document_name`, `document_type` - 'contract', 'proposal', 'scope', 'correspondence', 'workpaper', 'supporting', 'other'
- `file_url`, `file_size`, `file_type`
- `category`, `tags`
- `is_client_visible` - Access control
- `uploaded_by`, `uploaded_at`, `version`
- `parent_document_id`

**Relationships:**
- All reference: Audit (engagement), Firm, User profiles
- One-to-Many: Engagement → Communications, Deliverables, Documents

---

### 6.3 Engagement Letters
**Purpose:** Generate and manage engagement letters

**engagement_letter_templates:**
- `id`, `firm_id`
- `template_name`, `engagement_type`
- `template_content` - Rich text
- `placeholders[]` - Variables to replace
- `is_default`, `is_active`

**engagement_letters:**
- `id`, `engagement_id`, `firm_id`, `template_id`
- `letter_content` - Rendered content
- `version`, `status` - 'draft', 'pending_review', 'approved', 'sent', 'signed'
- `generated_by`, `approved_by`, `approved_at`
- `sent_at`, `signed_at`, `signature_data` - E-signature tracking

**Workflow:**
```
draft → pending_review → approved → sent → signed
```

---

### 6.4 Engagement Calendar & Budget

**engagement_calendar_events:**
- `id`, `engagement_id`, `firm_id`
- `event_type` - 'fieldwork', 'meeting', 'deadline', 'milestone', 'travel'
- `event_title`, `event_description`
- `start_date`, `end_date`, `all_day`
- `location`, `attendees[]`
- `milestone_id` - Link to milestone
- `external_calendar_id` - Sync with Outlook/Google
- `sync_status` - 'pending', 'synced', 'failed'

**engagement_budget_forecasts:**
- `id`, `engagement_id`, `firm_id`
- `forecast_date`, `forecast_method` - 'linear', 'earned_value', 'manual'
- `percent_complete`, `actual_hours_to_date`, `actual_cost_to_date`
- `estimated_hours_to_complete`, `estimated_cost_to_complete`
- `forecast_total_hours`, `forecast_total_cost`
- `variance_hours`, `variance_cost`, `variance_percent`
- `confidence_level` - 'low', 'medium', 'high'
- `assumptions`, `risk_factors[]`

**budget_variance_logs:**
- `id`, `engagement_id`, `firm_id`
- `variance_date`, `variance_type` - 'hours', 'cost', 'scope'
- `budgeted_amount`, `actual_amount`, `variance_amount`, `variance_percent`
- `variance_category` - 'staffing', 'scope_change', 'efficiency', 'rate'
- `explanation`, `corrective_action`
- `action_owner`, `action_due_date`, `action_status` - 'planned', 'in_progress', 'completed'

**burn_rate_snapshots:**
- `id`, `engagement_id`, `firm_id`
- `snapshot_date`, `hours_spent`, `cost_spent`, `days_elapsed`
- `daily_burn_rate_hours`, `daily_burn_rate_cost`
- `projected_completion_date`, `projected_total_hours`, `projected_total_cost`
- `burn_rate_status` - 'under', 'on_track', 'over', 'critical'

---

## 7. AUDIT REPORTING

### 7.1 Audit Reports
**Purpose:** Formal audit report generation and distribution

**Key Fields:**
- `id`, `audit_id`, `organization_id`
- `report_number` - Reference (unique per audit)
- `report_title`, `report_type` - 'draft', 'interim', 'final', 'management_letter', 'executive_summary'
- `report_date`, `executive_summary`
- `opinion` - 'unqualified', 'qualified', 'adverse', 'disclaimer'
- `overall_conclusion`
- `report_content` - JSONB structured sections
- `attachments` - JSONB file references
- `prepared_by`, `reviewed_by`, `approved_by`, `approved_date`
- `distribution_list[]` - Recipients
- `status` - 'draft', 'review', 'approved', 'distributed'

**Workflow:**
```
draft → review → approved → distributed
```

**Related TypeScript Types:**
- **AuditReporting** module with report generation support

---

### 7.2 Audit Metrics & Analytics
**Purpose:** KPI tracking and performance dashboards

**audit_metrics:**
- `id`, `organization_id`, `metric_date`
- `metric_type` - 'audit_cycle_time', 'finding_resolution_rate', 'budget_variance', etc.
- `metric_value`, `metric_unit` - 'days', 'percentage', 'count', 'currency'
- `dimension` - JSONB for breakdown (by area, by risk level, etc.)

**Available Metrics:**
- Cycle time: Days from plan to close
- Resolution rate: % of findings resolved
- Budget variance: Actual vs. budgeted hours/cost
- Finding density: Findings per hour of work
- Risk coverage: High-risk areas tested

---

## 8. CONFIRMATIONS & EXTERNAL EVIDENCE

### 8.1 Confirmation Tracker
**Purpose:** Manage external confirmations (bank, AR, AP, legal)

**Key Fields:**
- `id`, `engagement_id`, `firm_id`
- `confirmation_type` - 'accounts_receivable', 'accounts_payable', 'bank', 'legal', 'inventory', 'investment', 'loan', 'insurance', 'other'
- `entity_name`, `contact_name`, `contact_email`, `contact_phone`
- `amount`, `currency`, `account_number`
- `request_date`, `response_date`, `follow_up_date`
- `response_method` - 'email', 'mail', 'fax', 'portal', 'phone', 'in_person'
- `status` - 'pending', 'received', 'exception', 'not_responded', 'cancelled'
- `has_exception`, `exception_notes`, `exception_amount`, `resolution_notes`
- `workpaper_reference`, `procedure_id`
- `assigned_to`, `prepared_by`, `reviewed_by`

**Statistics:**
- Response rate tracking
- Exception analysis
- Overdue identification

**Relationships:**
- References: Engagement, Firm, Procedure
- Linked to: Workpapers for evidence

---

## 9. ADDITIONAL AUDIT TOOLS

### 9.1 Sampling & Sample Selection
**Purpose:** Statistical and judgmental sampling for audit procedures

**audit_samples:**
- `id`, `engagement_id`, `firm_id`
- `sample_name`, `sampling_method`
- `population_items`, `sample_size`, `selected_items`
- `sampling_objective`
- `risk_level` - Determines sample size parameters
- `confidence_level`, `tolerable_deviation_rate`
- `selection_results` - JSONB with detailed results
- Calculation tools for optimal sample size

### 9.2 Trial Balance & Account Analysis
**Purpose:** GL posting and account-level analysis

**trial_balance tables** with:
- Period posting and period-to-period comparison
- Account classifications
- Reconciliation tracking

### 9.3 Time Tracking
**Purpose:** Budget monitoring and resource utilization

**time_entries:**
- `id`, `engagement_id`, `user_id`
- `task_id` / `workpaper_id` - Work categorization
- `hours`, `billable`
- `date`, `description`
- Aggregates to actual hours spent

### 9.4 Quality Control
**Purpose:** Engagement quality assurance and EQCR

**quality_control tables** with:
- EQCR checklist completion
- Partner review sign-off
- Quality metrics tracking

---

## 10. PROFESSIONAL STANDARDS COMPLIANCE

### 10.1 Audit Standards Support
**Purpose:** Ensure compliance with audit standards

**Supported Standards:**
- SOX (Sarbanes-Oxley) - IT controls, ICFR assessment
- IFRS - International financial reporting standards
- GAAP - Generally accepted accounting principles
- GDPR - Data privacy compliance
- ISO 27001 - Information security
- SSAE 18 - Service auditor standards

**Implementation:**
- Compliance tagging on audits
- Standard-specific procedures
- Regulatory checklists
- Control testing matrices

---

## 11. KEY RELATIONSHIPS SUMMARY

### Entity Relationship Hierarchy
```
Organization
├── Audit Entities (audit universe)
├── Risk Assessments
├── Audit Plans
│   └── Audits (Engagements)
│       ├── Audit Programs
│       │   └── Engagement Procedures
│       │       ├── Audit Workpapers
│       │       │   ├── Audit Evidence
│       │       │   └── Workpaper Signoffs
│       │       └── Review Notes
│       ├── Audit Findings
│       │   ├── Finding Follow-ups
│       │   ├── Finding Linkages
│       │   └── Finding Evidence
│       ├── Audit Reports
│       ├── Engagement Deliverables
│       ├── Engagement Documents
│       ├── Engagement Communications
│       ├── Engagement Letters
│       ├── Engagement Calendar Events
│       ├── Engagement Budget Forecasts
│       └── Burn Rate Snapshots
├── Audit Procedures (templates)
├── Materiality Calculations
├── Confirmations
└── Team Members / User Roles
```

---

## 12. STATE MACHINES & WORKFLOWS

### Engagement Lifecycle
```
Draft/Planning
    ↓
Preparation (Planning phase)
    ↓
Fieldwork (Execution phase)
    ↓
Reporting (Finalization phase)
    ↓
Closed (Archived)
```

### Procedure Workflow
```
Not Started
    ↓ (assign & start)
In Progress
    ↓ (request review)
In Review
    ↓ (approve/revise)
Complete
    └─ Or: Not Applicable (conditional procedures)
```

### Finding Lifecycle
```
Open
    ├─ In Remediation (management action)
    │   ├─ Resolved (corrected)
    │   │   └─ Cleared (verified closed)
    │   └─ Accepted Risk (risk tolerance)
    └─ Accepted Risk (deferred action)
```

### Workpaper Sign-off
```
Preparer
    ↓
Reviewer
    ↓
Manager
    ↓
Partner
```

---

## 13. SECURITY & COMPLIANCE

### Row Level Security (RLS)
- Organization-level isolation
- Role-based access filters
- User role verification via security functions
- No RLS bypass without SECURITY DEFINER functions

### Data Protection
- Timestamps: created_at, updated_at on all tables
- Audit logging of changes (audit_logs table)
- User attribution: created_by, updated_by on key tables
- Soft deletes via status column (active/archived)

### Multi-tenancy
- `organization_id` on all core tables
- Queries always filtered by organization
- Single global database, logical isolation
- RLS ensures no cross-org data leakage

---

## 14. DESIGN PATTERNS

### Soft Deletes
- Status enum: 'active', 'inactive', 'archived'
- No hard DELETE operations
- Historical data preservation

### Versioning
- `version` and `is_current` flags on mutable entities:
  - Risk assessments, Materiality calculations, Audit procedures, Workpapers
- Create new version rather than update
- Immutable audit history

### Type Safety
- TypeScript interfaces define all domain models
- Strong typing for status enums
- Helper functions for UI rendering (colors, labels)

### Extensibility
- JSONB fields for custom attributes (metadata, config)
- Flexible for future fields without schema changes
- Industry-specific customizations

---

## 15. INDEXES & PERFORMANCE

### Critical Indexes
```sql
-- Organization/Access Control
idx_user_roles_org_user - Fast role lookups
idx_organization_members_user - User org discovery

-- Audit Management
idx_audits_org_status - Org audit listing/filtering
idx_audit_programs_audit - Program listing by audit
idx_audit_findings_audit_status - Finding dashboard

-- Engagement Data
idx_audit_workpapers_audit - Workpaper access
idx_engagement_*_engagement - All engagement sub-resources
idx_engagement_calendar_events_dates - Calendar queries

-- Search
idx_audits_title_search - Full-text search
idx_findings_search - Finding search by condition/criteria
```

### Query Optimization
- Foreign key indexes automatic in PostgreSQL
- Composite indexes on common filter combinations
- Date range indexes for timeline queries
- JSONB GIN indexes for metadata searches

---

## Summary Statistics

| Entity | Purpose | Cardinality | Status Lifecycle |
|--------|---------|-------------|------------------|
| Organizations | Multi-tenancy | 1000s | active → suspended → archived |
| Users/Roles | RBAC | 100K+ | N/A (status per membership) |
| Audit Entities | Universe | 10K-100K | active → inactive → archived |
| Risk Assessments | Planning | 10K+ | draft → submitted → approved |
| Audits | Engagements | 1K-10K | planned → fieldwork → reporting → closed |
| Procedures | Templates | 100-1000 | active/inactive |
| Eng. Procedures | Instances | 100K+ | not_started → in_progress → complete |
| Workpapers | Evidence | 10K-100K | draft → review → approved |
| Findings | Issues | 1K-10K | open → in_remediation → resolved/closed |
| Reports | Deliverables | 1K-5K | draft → approved → distributed |

---

## Business Rules

1. **Uniqueness Constraints:**
   - Audit number (per organization)
   - Finding number (per audit)
   - Entity code (per organization)
   - Report number (per organization)

2. **Validation Rules:**
   - Planned end date >= Planned start date
   - Actual dates only after planned dates
   - Finding amount <= Materiality threshold classifications
   - Sample size validates against population

3. **Workflow Rules:**
   - Audit can only close after all findings addressed
   - Report cannot approve until all findings assigned
   - Workpaper cannot approve until preparer complete
   - Risk assessment required before engagement finalization

4. **Immutability:**
   - Approved audits cannot be deleted (cascade prevents orphaning)
   - Approved materiality requires new version to change
   - Signed letters cannot be modified

5. **Cascading Rules:**
   - Deleting organization cascades to all related data
   - Deleting audit cascades to programs, procedures, findings, reports
   - Deleting procedures cascades to linked procedures

---

## API Integration Points

1. **CRM Integration** - Opportunity → Engagement conversion
2. **Calendar Integration** - Outlook/Google Calendar sync
3. **E-signature** - E-sign letter workflow
4. **File Storage** - Supabase Storage for evidence/documents
5. **Email Service** - Confirmations, notifications, reports
6. **Analytics** - Dashboard metrics aggregation
7. **Reporting** - PDF/Excel export

---

*Generated: 2025-12-31 | System: Obsidian Audit Platform*

