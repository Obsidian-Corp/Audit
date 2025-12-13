# Complete Database Schema Inventory
**Date**: 2025-11-29
**Source**: Supabase Migrations Analysis

## Core Platform Tables (Migration 001)

### 1. organizations
**Purpose**: Multi-tenant organization (audit firms) management
**Status**: ✅ Implemented
**Key Fields**:
- id, name, slug (unique)
- subscription_tier, subscription_status
- settings (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ slug, subscription

### 2. organization_members
**Purpose**: Junction table linking users to organizations
**Status**: ✅ Implemented
**Key Fields**:
- organization_id, user_id
- role (admin, partner, manager, senior, staff, viewer)
- status (active, inactive, invited)
**RLS**: ✅ Enabled
**Indexes**: ✅ organization, user, role, status

### 3. user_profiles
**Purpose**: Extended user profile information
**Status**: ✅ Implemented
**Key Fields**:
- id (references auth.users)
- full_name, avatar_url, phone
- notification_preferences, accessibility_settings (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ full_name

## Client & Engagement Tables (Migration 002)

### 4. clients
**Purpose**: Client information management
**Status**: ✅ Implemented
**Key Fields**:
- organization_id, name, legal_name
- industry, entity_type, tax_id
- status (active, inactive, archived)
- risk_rating, contacts (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ organization, status, name, industry

### 5. engagements
**Purpose**: Audit engagement management
**Status**: ✅ Implemented
**Key Fields**:
- organization_id, client_id, name
- engagement_type (financial_audit, review, etc.)
- status (planning, fieldwork, review, reporting, completed)
- materiality_amount, budget_hours, actual_hours
- team_members, settings (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ organization, client, status, type

## Audit Programs & Procedures Tables (Migration 003)

### 6. risk_assessments
**Purpose**: Comprehensive risk assessment data
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, organization_id
- business_profile, risk_areas (JSONB)
- fraud_assessment, it_assessment (JSONB)
- overall_risk_rating, heat_map_data (JSONB)
- status (draft, completed, reassessed)
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, organization, status

### 7. audit_programs
**Purpose**: Audit program management
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, risk_assessment_id
- total_procedures, completed_procedures
- estimated_hours, actual_hours
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, organization, status, template

### 8. audit_procedures
**Purpose**: Individual audit procedures
**Status**: ✅ Implemented (truncated in migration file)
**Key Fields**:
- program_id, engagement_id, organization_id
- code, title, objective, instructions
- category (planning, risk_assessment, substantive_testing, etc.)
- assigned_to, status, priority
**RLS**: ✅ Enabled
**Indexes**: ✅ program, engagement, category, assigned_to

## Audit Tools Tables (Migration 004)

### 9. materiality_calculations
**Purpose**: Materiality calculations for engagements
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, organization_id
- benchmark_type, benchmark_amount, percentage
- overall_materiality, performance_materiality, clearly_trivial
- component_allocations (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, organization

### 10. sampling_plans
**Purpose**: Statistical sampling plans and results
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, procedure_id
- sampling_method (mus, classical_variables, attributes)
- population_size, sample_size
- confidence_level, results (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, procedure, organization

### 11. confirmations
**Purpose**: Confirmation tracking (AR, AP, bank, legal)
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, organization_id
- confirmation_type, account_name, balance
- status (not_sent, sent, received, reconciled, exception)
- sent_date, response_date, confirmed_balance
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, type, status, organization

### 12. analytical_procedures
**Purpose**: Analytical procedure analyses
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, organization_id
- analysis_type (ratio, trend, variance, benford)
- current_period_data, prior_period_data (JSONB)
- variance_analysis, follow_up_procedures (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, type, organization

### 13. audit_findings
**Purpose**: Audit findings and deficiencies
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, procedure_id
- finding_type (control_deficiency, material_weakness, etc.)
- severity (critical, significant, high, medium, low)
- status (open, in_progress, resolved, accepted_risk)
- management_response, remediation_plan
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, severity, status, type

### 14. audit_adjustments
**Purpose**: Audit journal entries (AJEs, PJEs)
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, organization_id
- adjustment_type (aje, pje, sum)
- number, description, amount
- debit_account, credit_account
- status (proposed, approved, rejected, posted, passed)
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, type, status, finding
**Unique Constraint**: (engagement_id, number)

## Review & Collaboration Tables (Migration 005)

### 15. review_notes
**Purpose**: Review notes and questions for procedures
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, procedure_id, reviewer_id
- note, category, priority
- status (open, in_progress, resolved, withdrawn)
- preparer_response, resolved_by
**RLS**: ✅ Enabled (reviewer and assignee can update)
**Indexes**: ✅ engagement, procedure, reviewer, status

### 16. signoffs
**Purpose**: Digital sign-offs for procedures/engagements
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, entity_type, entity_id
- role (preparer, reviewer, manager, partner)
- user_id, signed_at
- signature_data (JSONB - IP, user agent, full name)
- locked
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, entity, user, role

### 17. audit_reports
**Purpose**: Audit report management
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, organization_id
- report_type (unqualified, qualified, adverse, etc.)
- content (JSONB), version, status
- reviewed_by (UUID[]), approved_by
- pdf_url, issued_date
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, type, status

### 18. audit_strategy_memos
**Purpose**: Audit strategy and planning memos
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id (unique), organization_id
- client_information, engagement_information (JSONB)
- risk_assessment_summary, audit_approach (JSONB)
- resource_allocation, timeline (JSONB)
- planning_checklist (JSONB), checklist_completion %
**RLS**: ✅ Enabled
**Indexes**: ✅ engagement, organization, status

### 19. notifications
**Purpose**: In-app notifications
**Status**: ✅ Implemented
**Key Fields**:
- user_id, type, title, message
- link, metadata (JSONB)
- read, read_at
**RLS**: ✅ Enabled (users see only their own)
**Indexes**: ✅ user, read, type, created_at

### 20. activity_log
**Purpose**: Audit trail of all user actions
**Status**: ✅ Implemented
**Key Fields**:
- organization_id, engagement_id, user_id
- action, entity_type, entity_id
- changes, metadata (JSONB)
- ip_address, user_agent
**RLS**: ✅ Enabled
**Indexes**: ✅ organization, engagement, user, entity, created_at

## Documents & Storage Tables (Migration 006)

### 21. documents
**Purpose**: Document metadata and file references
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, procedure_id, organization_id
- storage_path, file_name, file_size, mime_type
- category (workpaper, client_provided, report, etc.)
- tags (TEXT[]), version, is_latest_version
- parent_document_id, uploaded_by
- virus_scanned, virus_scan_result
**RLS**: ✅ Enabled (complex policies for view/upload/update/delete)
**Indexes**: ✅ engagement, procedure, organization, uploaded_by, category, parent, tags (GIN)

### 22. document_versions
**Purpose**: Document version history
**Status**: ✅ Implemented
**Key Fields**:
- document_id, version_number
- storage_path, file_size
- uploaded_by, change_summary
**RLS**: ✅ Enabled
**Indexes**: ✅ document, uploaded_by
**Unique Constraint**: (document_id, version_number)

### 23. document_shares
**Purpose**: Document sharing and access control
**Status**: ✅ Implemented
**Key Fields**:
- document_id, organization_id
- shared_by, shared_with
- share_type (internal, external, client)
- access_level (view, download, edit)
- expiry_date, password_protected
- access_count, last_accessed_at
**RLS**: ✅ Enabled
**Indexes**: ✅ document, shared_with, organization

### 24. templates
**Purpose**: Reusable templates for programs, procedures, reports
**Status**: ✅ Implemented
**Key Fields**:
- organization_id, name, description
- template_type (audit_program, procedure, report, etc.)
- content (JSONB), variables (JSONB)
- is_public, is_archived
- usage_count
**RLS**: ✅ Enabled (view public or organization templates)
**Indexes**: ✅ organization, type, public

### 25. time_entries
**Purpose**: Time tracking for engagements
**Status**: ✅ Implemented
**Key Fields**:
- engagement_id, procedure_id, user_id
- description, hours, date
- billable, hourly_rate
- status (draft, submitted, approved, rejected)
- approved_by, approved_at
**RLS**: ✅ Enabled (users see own or all if manager+)
**Indexes**: ✅ engagement, procedure, user, date, organization

### 26. comments
**Purpose**: Comments and discussions
**Status**: ✅ Implemented
**Key Fields**:
- organization_id, engagement_id
- entity_type, entity_id
- user_id, content
- parent_comment_id, mentions (JSONB)
**RLS**: ✅ Enabled
**Indexes**: ✅ entity, user, parent, organization, created_at

## Platform Admin Tables (Earlier Migrations)

### 27. platform_admin_users
**Purpose**: Separate platform administrator authentication
**Status**: ✅ Implemented (from earlier migrations)
**Schema**: platform_admin schema

### 28. firm_invitations
**Purpose**: Invitation system for onboarding firms
**Status**: ✅ Implemented
**Key Fields**: token, email, firm_name, status, invited_by

### 29. billing_subscriptions, billing_invoices, billing_payment_methods
**Purpose**: Billing and subscription management
**Status**: ✅ Implemented (Stripe integration)

### 30. email_templates, email_analytics
**Purpose**: Email template management and tracking
**Status**: ✅ Implemented

### 31. performance_metrics, slow_query_logs
**Purpose**: Performance monitoring
**Status**: ✅ Implemented

### 32. impersonation_sessions
**Purpose**: Admin impersonation audit trail
**Status**: ✅ Implemented

## Summary Statistics

**Total Tables**: 32+ identified
**RLS Enabled**: ✅ All tables
**Indexes**: ✅ Comprehensive coverage
**Foreign Keys**: ✅ Proper CASCADE/SET NULL behavior
**Triggers**: ✅ updated_at columns automated
**Helper Functions**: ✅ Multiple utility functions
**JSONB Columns**: Extensive use for flexible data structures
**Multi-tenant**: ✅ organization_id on all tenant data

## Data Integrity Features

- ✅ CHECK constraints on enums, percentages, amounts
- ✅ UNIQUE constraints where appropriate
- ✅ NOT NULL on critical fields
- ✅ CASCADE deletes for child records
- ✅ SET NULL for optional references
- ✅ Default values on status fields
- ✅ Timestamp tracking (created_at, updated_at)
