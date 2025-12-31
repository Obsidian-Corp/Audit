# Obsidian Audit Platform - Codebase Documentation

Generated: December 27, 2025

## Overview

This directory contains comprehensive documentation of the **Obsidian Audit Platform** codebase, an enterprise audit execution engine built with React, TypeScript, and Supabase.

## Generated Documentation

### 1. **CODEBASE_ANALYSIS.md** (1,802 lines, 50 KB)
Comprehensive technical reference covering:
- **Database Schema**: 150+ tables with relationships, constraints, and enums
- **Application Routes**: All 38 routes with protection strategies
- **Component Architecture**: 243 React components organized by domain
- **Hooks & Data Fetching**: All 98 custom hooks documented
- **Context & State Management**: 4 global contexts and patterns
- **Technology Stack**: Complete dependencies and versions
- **Architectural Patterns**: 15 design patterns explained

**Use this document for:**
- Understanding database relationships and table structures
- Finding where specific functionality is implemented
- Learning architectural patterns and conventions
- Reference during feature development

### 2. **QUICK_REFERENCE.txt** (490 lines, 15 KB)
Executive summary and lookup guide containing:
- Database tables grouped by functional domain
- All 38 application routes in quick format
- Hook catalog by feature area
- Global context descriptions
- Role hierarchy overview
- Key patterns and conventions
- Common development tasks

**Use this document for:**
- Quick lookups while coding
- Understanding high-level structure
- Finding related functionality
- Common task templates

## Key Information At A Glance

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript 5.8.3
- **Build**: Vite 5.4.19
- **Styling**: Tailwind CSS 3.4.17
- **Components**: Radix UI primitives
- **State**: TanStack React Query, React Hook Form, Zustand
- **Backend**: Supabase (PostgreSQL + Auth)
- **Editor**: TipTap (rich text)
- **Charts**: Recharts
- **Testing**: Vitest

### Application Structure
```
Total Size: 243 components, 98 hooks, 38 routes
Database: 150+ PostgreSQL tables
Users Per Firm: Multi-tenant with firm_id isolation
Authentication: Supabase Auth + custom roles
Deployment: Vite build + Docker support
```

### Primary Workflows

**Engagement Lifecycle:**
```
Draft → Accepted → In Progress → Complete
```

**Procedure Execution:**
```
Not Started → In Progress → In Review → Complete
       ↑                           ↓
       ←———— Not Applicable ————←
```

**Quality Control Chain:**
```
Preparer → Reviewer → Senior → Partner → Independent QC → Final Approval
```

## Database Tables Summary

### Core Tables (12 groups)

| Domain | Key Tables | Purpose |
|--------|-----------|---------|
| **Engagement** | engagements, clients, engagement_letters | Core engagement container |
| **Programs** | audit_programs, audit_procedures, engagement_procedures | Audit template and execution |
| **Workpapers** | audit_workpapers, audit_evidence, audit_findings | Evidence collection and findings |
| **Risk & Materiality** | risk_assessments, materiality_calculations, control_walkthroughs | Risk planning |
| **Quality Control** | quality_control_reviews, approval_workflows, deliverable_approvals | Review workflows |
| **Audit Tools** | sampling_selections, trial_balance_data, confirmations, benfords_law | Specialized calculations |
| **Users** | profiles, user_roles, firms | Authentication & access |
| **Professional Standards** | engagement_acceptance_checklists, independence_declarations, conflict_of_interest_register | Standards compliance |
| **AI & Automation** | ai_agents, ai_workflows, ai_executions, ai_prompts | Automation infrastructure |
| **Engagement Workflow** | engagement_milestones, engagement_budget_forecasts, engagement_communications | Engagement tracking |
| **Tasks & Documents** | tasks, action_items, audit_entities | Task and entity management |
| **Collaboration** | workpaper_comments, meetings, deliverable_versions | Collaboration features |

### Total Table Count: 150+

## Route Structure (38 routes)

### By Category

**Authentication (6 routes)**
- /auth/login, /auth/signup, /auth/forgot-password
- /auth/accept-invite/:token, /auth/accept-firm-invite/:token

**Workspace (1 route)**
- /workspace (main dashboard)

**Engagements (6 routes)** - Primary workflow
- /engagements, /engagements/:id, /engagements/:id/audit
- /engagements/:id/assign-procedures, /engagements/templates, /engagements/approvals

**Audit Execution (4 routes)**
- /universe, /risks, /plans, /audits, /audits/:id/workpapers

**Programs & Procedures (4 routes)**
- /programs, /programs/:id, /procedures, /my-procedures

**Workpapers & Findings (4 routes)**
- /workpapers, /workpapers/:id, /findings, /evidence

**Quality Control (2 routes)**
- /review-queue, /quality-control

**Tasks & Coordination (2 routes)**
- /tasks, /information-requests

**Analytics (1 route)**
- /analytics

**Audit Tools (4 routes)**
- /tools/materiality, /tools/sampling, /tools/confirmations, /tools/analytical-procedures

**Settings & Admin (3 routes)**
- /settings, /admin, /admin/users

## Component Organization (243 files)

### By Type

| Category | Count | Location |
|----------|-------|----------|
| UI Primitives | 50+ | /components/ui/ |
| Engagement | 20+ | /components/engagement/ |
| Audit Features | 50+ | /components/audit/ |
| Audit Tools | 30+ | /components/audit-tools/ |
| Settings | 10+ | /components/settings/ |
| Admin | 8+ | /components/admin/ |
| Workspace | 5+ | /components/workspace/ |
| Auth | 5+ | /components/auth/ |
| Shared | 15+ | /components/shared/ |
| Others | 40+ | Various specialized components |

## Hooks Catalog (98 files)

### By Feature Area

- **Engagement**: useEngagement, useEngagementWorkflow, useEngagementAcceptance, useEngagementTemplates (5)
- **Procedures**: useProcedures, useProcedureWorkflow, useEngagementProcedures (3)
- **Workpapers**: useWorkpapers, useWorkpaperCollaboration, useProfessionalStandards (3)
- **Audit Tools**: useMateriality, useSampling, useTrialBalance, useConfirmations, useBenfordsLawAnalysis (5)
- **Quality Control**: useQualityControl, useControlTesting (2)
- **Findings**: useFindings, useFindingsAnalytics (2)
- **Reporting**: useAuditReporting, useGoingConcern (2)
- **Risk Assessment**: useRiskAssessment, useComplianceAnalytics (2)
- **Admin**: useUsers, usePermissions, useImpersonation (3)
- **Real-time**: useRealtimeSubscription, useDashboardRealtime (2)
- **Documents**: useDocumentStorage, useExcelImport (2)
- **Other utilities**: 70+ additional hooks

## Role Hierarchy (10 roles)

### Internal (Firm Users)
1. **partner** - Full platform access
2. **firm_administrator** - Admin-level access
3. **practice_leader** - Strategic oversight
4. **engagement_manager** - Manage engagements
5. **senior_auditor** - Review & oversight
6. **staff_auditor** - Execution
7. **business_development** - Sales/BD
8. **quality_control_reviewer** - Independent QC

### External (Client Portal)
9. **client_administrator** - Contact manager
10. **client_user** - Info requestor

## Key Architectural Features

### 1. Multi-Tenancy
- Every user belongs to exactly one firm
- `firm_id` column on all data tables
- RLS policies enforce tenant isolation at database
- TenantContext provides firm information throughout app

### 2. Engagement-Centric Design
- Engagement is root container for all work
- Programs, procedures, workpapers, findings belong to engagement
- 83% of routes accessible from engagement context
- Reduces fragmentation and improves UX

### 3. Professional Standards Compliance
- AU-C audit standard support built-in
- Engagement acceptance checklists (AU-C 210)
- Independence declarations and COI tracking
- Multi-level workpaper sign-off workflows
- Immutable audit trail for compliance

### 4. Procedure-Driven Execution
- Programs define audit approach
- Procedures assigned to engagement team
- Workpapers collect evidence
- Dependencies prevent out-of-order execution
- Status workflow with review gates

### 5. Real-Time Collaboration
- Supabase real-time subscriptions
- Live workpaper updates
- Comment threading
- Conflict resolution via last-write-wins

### 6. Quality Assurance
- Multiple approval layers (preparer → reviewer → senior → partner → QC)
- Independent QC review
- Configurable approval workflows per firm
- Comprehensive audit logging

### 7. AI & Automation
- Configurable AI agents framework
- Multi-step workflow definitions
- Prompt library management
- Cost tracking per execution
- Event-based triggering

## Getting Started

### 1. Understanding the Codebase
1. Read the **QUICK_REFERENCE.txt** for overview
2. Review **CODEBASE_ANALYSIS.md** section on Database Schema
3. Study src/App.tsx for route structure
4. Review src/contexts/ for state management

### 2. Key Files to Review
```
Core Application:
- src/App.tsx                           (routing)
- src/contexts/AuthContext.tsx          (auth state)
- src/contexts/TenantContext.tsx        (multi-tenancy)
- src/components/AppSidebar.tsx         (navigation)

Database:
- src/integrations/supabase/types.ts    (schema - auto-generated)

Engagement Features:
- src/hooks/useEngagement.tsx
- src/pages/engagement/EngagementDetail.tsx

Audit Tools:
- src/hooks/useMateriality.ts
- src/hooks/useSampling.ts
- src/components/audit-tools/
```

### 3. Common Development Tasks

**Add a new route:**
1. Create page in src/pages/
2. Import in App.tsx
3. Add route with guard (RequireAuth, RequireRole)
4. Update AppSidebar navigation

**Fetch data:**
1. Use useQuery from React Query
2. Include firm_id filter for tenant isolation
3. Add error handling and loading states
4. Invalidate cache on mutations

**Create a form:**
1. Define Zod schema
2. Use React Hook Form with zodResolver
3. Add form fields using ui/ components
4. Submit with useMutation
5. Show success/error toast

**Add a component:**
1. Create in appropriate /components/ folder
2. Use Tailwind CSS (no custom CSS)
3. Export from folder's index.ts
4. Add TypeScript props interface

## Document Navigation

### For Database Understanding
→ See CODEBASE_ANALYSIS.md section: "Database Schema"

### For Route Definitions  
→ See CODEBASE_ANALYSIS.md section: "Application Routes"

### For Component Organization
→ See CODEBASE_ANALYSIS.md section: "Component Architecture"

### For Quick Lookups
→ See QUICK_REFERENCE.txt for immediate answers

### For Hook Documentation
→ See CODEBASE_ANALYSIS.md section: "Hooks & Data Fetching"

### For Architecture Patterns
→ See CODEBASE_ANALYSIS.md section: "Architectural Patterns"

## Important Notes

### Multi-Tenancy
- All queries must include firm_id filter
- RLS policies prevent cross-tenant access at database
- Users see only their organization's data

### Type Safety
- Full TypeScript with strict mode
- Database types auto-generated from Supabase
- Form schemas with Zod
- Custom types in src/types/

### State Management
- Server state: React Query (caching, background sync)
- Form state: React Hook Form
- Global state: Zupabase Auth context + custom contexts
- UI state: Component local state with useState

### Error Handling
- Try-catch in hooks
- Error boundaries on routes
- Toast notifications for user feedback
- Sentry integration for production

### Performance
- Virtual lists for large datasets
- Code splitting on routes
- React Query deduplication
- Memoization where needed

## Database Access

### Supabase Connection
- Configuration: `/src/integrations/supabase/client.ts`
- Auto-generated types: `/src/integrations/supabase/types.ts`
- Migrations: `/supabase/migrations/`
- RLS policies: Applied at database level

### Recent Migrations
- Organization ID consolidation (Dec 27)
- Audit logs integration (Dec 27)
- Audit tools tables (Dec 29)
- Firm invitations & onboarding (Dec 28)
- Email templates & notifications (Dec 26)

## Support Resources

### Within Repository
- **DESIGN_DOCUMENT.md** - High-level system design
- **ARCHITECTURE_DECISION.md** - Architectural choices
- **IMPLEMENTATION_CHECKLIST.md** - Feature tracking
- **API_SPECIFICATION.md** - API documentation
- **SYSTEM_DESIGN_DOCUMENT.md** - Comprehensive design

### This Documentation
- **CODEBASE_ANALYSIS.md** - Detailed technical reference
- **QUICK_REFERENCE.txt** - Quick lookup guide
- **README_CODEBASE_GUIDE.md** - This file

---

## Summary

This codebase represents a **mature, professional audit platform** with:
- Strong multi-tenant architecture
- Professional standards compliance
- Rich feature set (tools, workflows, quality control)
- Modern React/TypeScript development
- Enterprise-ready infrastructure

Use the provided documentation to quickly understand any aspect of the system during development.

**Last Updated:** December 27, 2025
