# Obsidian Audit Application - Route & Page Inventory

## Overview

This document provides a comprehensive inventory of all routes, pages, and navigation structures in the Obsidian Audit application. The application uses role-based access control with a centralized navigation configuration and route guards.

---

## Authentication & Authorization Model

### Access Control Hierarchy

**Public Routes** (No Authentication Required)
- Landing pages, login, signup, password recovery
- Platform product pages (marketing-style pages)
- Invitation acceptance pages

**Authenticated Routes** (Login Required, No Role Check)
- `/workspace` - Dashboard
- `/inbox` - Notifications
- `/clients` - Client management
- `/engagements*` - Engagement management and tabs
- `/settings` - User settings
- All audit tools: `/tools/*`

**Role-Based Routes** (Specific Roles Required)
- See detailed route access matrix below

### Role Definitions

**Internal Roles** (Audit Firm Staff)
- `staff_auditor` - Entry-level auditor
- `senior_auditor` - Senior auditor
- `engagement_manager` - Engagement/manager-level
- `partner` - Partner/decision maker
- `practice_leader` - Practice area leader
- `firm_administrator` - System admin
- `business_development` - BD team member

**Senior+ Roles** (Review & Quality Functions)
- senior_auditor
- engagement_manager
- partner
- practice_leader
- firm_administrator

**Manager+ Roles** (Planning & Approvals)
- engagement_manager
- partner
- practice_leader
- firm_administrator

**Admin Roles** (System Administration)
- firm_administrator

---

## Route Configuration

### Public Routes (No Auth Required)

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Index | Landing page |
| `/auth/login` | Login | User authentication |
| `/auth/forgot-password` | ForgotPassword | Password recovery |
| `/auth/signup` | Signup | User registration |
| `/auth/accept-invite/:token` | AcceptInvitation | Accept team invitation |
| `/auth/accept-firm-invite/:token` | AcceptFirmInvitation | Accept firm invitation |
| `/platform/ontology` | OntologyPage | Platform product page |
| `/platform/audit` | AuditPage | Platform product page |
| `/platform/codex` | CodexPage | Platform product page |
| `/platform/forge` | ForgePage | Platform product page |
| `/contact` | ContactPage | Contact form |

### Main Application Routes (AuthRequired)

All routes below require authentication via `RequireAuth` guard and render within `AppLayout`

#### Workspace & Core Pages

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/workspace` | MyWorkspace | Required | All | Personal dashboard | - |
| `/dashboard` | Redirect to `/workspace` | Required | All | Dashboard redirect | - |
| `/inbox` | InboxPage | Required | All | Notifications & action items | Count |
| `/clients` | ClientsPage | Required | All | Client management | - |
| `/settings` | Settings | Required | All | User account settings | - |

#### Audit Execution - Core (Internal Roles)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/audits` | ActiveAuditsList | Required | Internal | List active audits | - |
| `/audits/:auditId/workpapers` | AuditWorkpapers | Required | Internal | Workpapers for specific audit | - |
| `/workpapers` | WorkpapersLanding | Required | Internal | Workpapers hub/landing | - |
| `/workpapers/:id` | WorkpaperEditor | Required | Internal | Edit specific workpaper | - |
| `/findings` | FindingsManagement | Required | Internal | Manage audit findings | Count |
| `/evidence` | EvidenceLibrary | Required | Internal | Evidence documentation library | - |
| `/information-requests` | InformationRequests | Required | Internal | Client info requests | Count |
| `/tasks` | TaskBoard | Required | Internal | Task management board | Count |

#### My Work (Internal Roles)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/my-procedures` | MyProcedures | Required | Internal | User's assigned procedures | Count |
| `/review-queue` | ProcedureReviewQueue | Required | Senior+ | Items pending review | Count |

#### Programs & Procedures Library (Internal Roles)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/programs` | ProgramLibrary | Required | Internal | Audit program templates | - |
| `/programs/:id` | ProgramDetail | Required | Internal | Specific program details | - |
| `/procedures` | ProcedureLibrary | Required | Internal | Procedure templates | - |

#### Planning & Risk Management (Manager+ Roles)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/universe` | AuditUniverse | Required | Manager+ | Audit universe definition | - |
| `/risks` | RiskAssessments | Required | Manager+ | Risk assessment matrix | - |
| `/plans` | AuditPlans | Required | Manager+ | Audit plans & scheduling | - |

#### Quality Control & Analytics (Senior+ Roles)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/quality-control` | QualityControlDashboard | Required | Senior+ | QC oversight dashboard | Dot |
| `/analytics` | ProgramAnalytics | Required | Senior+ | Program execution analytics | - |

#### Audit Tools (Open to All Authenticated Users)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/tools/materiality` | MaterialityCalculatorPage | Required | Senior+ | Materiality calculation | - |
| `/tools/sampling` | SamplingCalculatorPage | Required | Internal | Sample size calculation | - |
| `/tools/confirmations` | ConfirmationTrackerPage | Required | All | Confirmation tracking | Count |
| `/tools/analytical-procedures` | AnalyticalProceduresPage | Required | Internal | Analytical procedures tool | - |

#### Engagements Management (Authenticated)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/engagements` | EngagementList | Required | All | List all engagements | - |
| `/engagements/:id` | EngagementDetail | Required | All | Engagement overview | - |
| `/engagements/:id/dashboard` | EngagementDashboard | Required | All | Engagement dashboard | - |
| `/engagements/:id/audit` | EngagementDetailAudit | Required | All | Engagement audit tab | - |
| `/engagements/:id/review` | ReviewQueuePage | Required | All | Engagement review status | - |
| `/engagements/:engagementId/assign-procedures` | ProcedureAssignment | Required | All | Assign procedures to engagement | - |
| `/engagements/templates` | EngagementTemplates | Required | Manager+ | Engagement templates | - |
| `/engagements/approvals` | ApprovalDashboard | Required | Manager+ | Approval workflow dashboard | Count |

#### Administration (Admin Roles)

| Path | Component | Auth | Roles | Purpose | Badge |
|------|-----------|------|-------|---------|-------|
| `/admin` | AdminDashboard | Required | Admin/Partner | Admin overview | - |
| `/admin/users` | UserManagement | Required | Admin/Partner | User management & roles | - |

#### Error Handling

| Path | Component | Purpose |
|------|-----------|---------|
| `*` (404) | NotFound | Catch-all for undefined routes |

---

## Navigation Structure

### Sidebar Navigation Hierarchy

The application uses a collapsible section-based navigation system defined in `src/config/navigation.ts`. The sidebar is rendered by `AppSidebar.tsx` and uses `sidebarNavigation` configuration.

#### Navigation Sections

##### 1. Dashboard Section (Non-Collapsible)
```
Dashboard
  ├─ Dashboard (all users) → /workspace
```

##### 2. My Work Section (Collapsible, Internal Roles)
```
My Work [Internal Roles]
  ├─ My Procedures (badge: count) → /my-procedures
  ├─ Tasks (badge: count) → /tasks
  ├─ Time Tracking → /time-tracking
  └─ Review Queue (Senior+ only, badge: count) → /review-queue
```

##### 3. Engagements Section (Collapsible, All Users)
```
Engagements [All Users]
  ├─ Active Engagements → /engagements
  ├─ Clients → /clients
  ├─ Templates (Manager+ only) → /engagements/templates
  └─ Approvals (Manager+ only, badge: count) → /engagements/approvals
```

##### 4. Audit Execution Section (Collapsible, Internal Roles)
```
Audit Execution [Internal Roles]
  ├─ Workpapers → /workpapers
  ├─ Findings (badge: count) → /findings
  ├─ Evidence → /evidence
  └─ Info Requests (badge: count) → /information-requests
```

##### 5. Tools & Libraries Section (Collapsible, Internal Roles)
```
Tools & Libraries [Internal Roles]
  ├─ Program Library → /programs
  ├─ Procedure Library → /procedures
  ├─ Materiality (Senior+ only) → /tools/materiality
  ├─ Sampling → /tools/sampling
  ├─ Analytical Procedures → /tools/analytical-procedures
  └─ Confirmations (badge: count) → /tools/confirmations
```

##### 6. Planning & Risk Section (Collapsible, Manager+ Roles)
```
Planning & Risk [Manager+ Roles]
  ├─ Audit Universe → /universe
  ├─ Risk Assessments → /risks
  └─ Audit Plans → /plans
```

##### 7. Quality & Analytics Section (Collapsible, Senior+ Roles)
```
Quality & Analytics [Senior+ Roles]
  ├─ QC Dashboard (badge: dot) → /quality-control
  └─ Analytics → /analytics
```

##### 8. Administration Section (Collapsible, Admin Only)
```
Administration [Firm Administrator Only]
  ├─ User Management → /admin/users
  ├─ Team Directory → /admin/users
  └─ Settings → /settings
```

#### Sidebar Footer
```
Settings (All Users) → /settings
Sign Out (All Users) → logout
```

---

## Access Control Matrix

### Role-Based Access Summary

| Feature | Staff | Senior | Manager | Partner | Practice Leader | Firm Admin | BD |
|---------|-------|--------|---------|---------|-----------------|------------|-----|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Inbox | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Procedures | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Review Queue | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Workpapers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Findings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Evidence Library | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Programs Library | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Procedures Library | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Materiality Tool | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Sampling Tool | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Confirmations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytical Procedures | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Audit Universe | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Risk Assessments | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Audit Plans | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| QC Dashboard | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Analytics | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Engagements | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Templates | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Approvals | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Admin Dashboard | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ |
| User Management | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ | ✗ |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Badge System

### Badge Types

Certain navigation items display badges to indicate available actions or counts:

| Badge Type | Items | Meaning |
|-----------|-------|---------|
| **Count** (numeric badge) | My Procedures, Tasks, Review Queue, Findings, Info Requests, Confirmations, Approvals | Number of pending items requiring user attention |
| **Dot** (status indicator) | QC Dashboard | Status indicator (usually error/warning state) |

### Items with Badges

From `sidebarNavigation` configuration:

1. **My Procedures** - Count badge (unreviewed/assigned procedures)
2. **Tasks** - Count badge (assigned tasks)
3. **Review Queue** - Count badge (items awaiting user review)
4. **Findings** - Count badge (open/unresolved findings)
5. **Info Requests** - Count badge (pending information requests)
6. **Confirmations** - Count badge (pending confirmations)
7. **Approvals** - Count badge (pending approvals)
8. **QC Dashboard** - Dot badge (quality control status)

---

## Layout Components

### Main Application Layout Stack

```
App.tsx (Router Configuration)
    ↓
RequireAuth Guard (Authentication Check)
    ↓
RequireRole Guard (Optional - Role-Based Routes)
    ↓
AppLayout (Main Container)
    ├─ Header
    │   ├─ Sidebar Trigger
    │   ├─ Logo + Brand
    │   ├─ App Switcher (Desktop only)
    │   ├─ Time Tracking Widget
    │   ├─ Notifications Dropdown
    │   └─ User Menu (Avatar + Dropdown)
    │
    ├─ Sidebar (Collapsible)
    │   ├─ Header
    │   │   ├─ Firm Switcher
    │   │   └─ User Info + Role Badge
    │   │
    │   ├─ Content (Navigation Sections)
    │   │   └─ CollapsibleNavSection × 8
    │   │
    │   └─ Footer
    │       ├─ Settings Button
    │       └─ Sign Out Button
    │
    └─ Main Content Area
        └─ Outlet (Route-specific page)
```

### Responsive Behavior

- **Desktop**: Full sidebar visible by default, collapsible to icon-only
- **Mobile**: Sidebar hidden by default, triggered via hamburger menu
- **App Switcher**: Hidden on mobile, moved to user menu
- **Header Spacing**: Adaptive padding (3 on mobile, 6 on desktop)

---

## Guard Implementation

### RequireAuth Guard

**Location**: `src/components/guards/RequireAuth.tsx`

**Behavior**:
- Checks for authenticated user from `AuthContext`
- Redirects to `/auth/login` if not authenticated
- Shows loading spinner while auth state is being verified
- Demo mode available (disabled by default)

**Usage**:
```tsx
<RequireAuth>
  <AppLayout />
</RequireAuth>
```

### RequireRole Guard

**Location**: `src/components/guards/RequireRole.tsx`

**Behavior**:
- Verifies user has required role(s)
- Can use explicit `allowedRoles` prop or auto-detect from route config
- Shows unauthorized page or redirects (configurable)
- Falls back to `/workspace` by default if unauthorized

**Usage**:
```tsx
// Explicit roles
<RequireRole allowedRoles={['partner', 'firm_administrator']}>
  <AdminPage />
</RequireRole>

// Auto-detect from route config
<RequireRole>
  <ProtectedPage />
</RequireRole>
```

### Route Guards Configuration

**Location**: `src/config/routeGuards.ts`

Defines role requirements for routes using `findRouteGuard()` function to match paths with guard configurations.

---

## Key Features & Integrations

### Authentication Context (`AuthContext`)
- Manages user session
- Provides user profile and roles
- Handles sign out
- Manages loading state during auth check

### Navigation Badges (`useNavigationBadges`)
- Fetches badge counts for navigation items
- Updates in real-time for counts like review queue, tasks, etc.
- Supports both count badges and status indicators

### Sidebar State Persistence
- Saves sidebar open/closed state to localStorage
- Key: `sidebar-state`
- Persists across sessions

### Keyboard Navigation (`useKeyboardNavigation`)
- Arrow keys for navigation
- Home/End for section navigation
- Enter to activate
- Cmd/Ctrl+/ to focus sidebar
- Escape to close sidebar

---

## Type Definitions

### NavSectionItem (Sidebar Navigation Item)
```typescript
interface NavSectionItem {
  id: string;                // Unique identifier
  title: string;             // Display text
  url: string;               // Route URL
  icon: LucideIcon;          // Icon component
  roles?: AppRole[];         // Required roles (empty = all)
  badge?: 'count' | 'dot';   // Badge type
}
```

### NavigationSection (Collapsible Section)
```typescript
interface NavigationSection {
  id: string;                              // Section identifier
  label: string;                           // Section display name
  collapsible: boolean;                    // Can be collapsed
  defaultExpanded?: boolean | 'role-based'; // Initial state
  roles?: AppRole[];                       // Section visibility
  items: NavSectionItem[];                 // Section items
}
```

### RouteGuard (Route Protection)
```typescript
interface RouteGuard {
  path: string;              // Route pattern
  allowedRoles: AppRole[];   // Allowed roles
  fallbackPath?: string;     // Redirect on access denied
  showUnauthorized?: boolean; // Show error page instead
}
```

---

## Configuration Files

### Primary Configuration Files

1. **`src/config/navigation.ts`**
   - Role constants (INTERNAL_ROLES, SENIOR_PLUS_ROLES, etc.)
   - Sidebar navigation structure (`sidebarNavigation`)
   - Navigation item types and interfaces
   - Legacy navigation definitions (ENGAGEMENT_NAVIGATION, GLOBAL_NAVIGATION)
   - Helper functions for navigation queries

2. **`src/config/routeGuards.ts`**
   - Route guard definitions
   - Role-based access control configuration
   - Route matching and validation functions

3. **`src/App.tsx`**
   - Route definitions using React Router
   - Guard wrapping (RequireAuth, RequireRole)
   - Layout component mounting
   - Public vs. protected route separation

### Layout Components

1. **`src/components/AppLayout.tsx`**
   - Main application container
   - Header with navigation controls
   - Sidebar integration
   - Main content outlet

2. **`src/components/AppSidebar.tsx`**
   - Sidebar implementation
   - Navigation section rendering
   - User info display
   - Role-based section filtering
   - Keyboard navigation support

---

## Summary Statistics

### Route Count
- **Total Routes**: 54 defined routes
- **Public Routes**: 11
- **Authenticated Routes (no role check)**: 12
- **Role-Based Routes**: 31

### Navigation Items
- **Sidebar Sections**: 8
- **Total Navigation Items**: 31
- **Items with Badges**: 8
- **Collapsible Sections**: 7
- **Non-Collapsible Sections**: 1

### Role Coverage
- **Total Roles**: 7 internal + 1 client
- **Manager+ Routes**: 6 exclusive routes
- **Senior+ Routes**: 4 exclusive routes
- **Admin-Only Routes**: 2 exclusive routes
- **Internal-Only Routes**: 11 exclusive routes

---

## Navigation Hierarchy Diagram

```
Root (/)
├─ Public Pages
│  ├─ /auth/login
│  ├─ /auth/signup
│  ├─ /auth/forgot-password
│  ├─ /auth/accept-invite/:token
│  ├─ /auth/accept-firm-invite/:token
│  └─ /platform/* (Marketing pages)
│
├─ Protected Routes (RequireAuth)
│  │
│  ├─ Core Workspace [All Users]
│  │  ├─ /workspace (Dashboard)
│  │  ├─ /inbox (Notifications)
│  │  ├─ /clients (Client Management)
│  │  └─ /settings (User Settings)
│  │
│  ├─ Engagement Management [All Users]
│  │  ├─ /engagements (List)
│  │  ├─ /engagements/:id/* (Details & Tabs)
│  │  ├─ /engagements/templates [Manager+]
│  │  └─ /engagements/approvals [Manager+]
│  │
│  ├─ Audit Execution [Internal Roles]
│  │  ├─ /audits (List)
│  │  ├─ /audits/:auditId/workpapers
│  │  ├─ /workpapers (Hub)
│  │  ├─ /workpapers/:id (Editor)
│  │  ├─ /findings (Management)
│  │  ├─ /evidence (Library)
│  │  └─ /information-requests (Client Requests)
│  │
│  ├─ My Work [Internal Roles]
│  │  ├─ /my-procedures
│  │  ├─ /review-queue [Senior+]
│  │  └─ /tasks
│  │
│  ├─ Libraries [Internal Roles]
│  │  ├─ /programs (Library)
│  │  ├─ /programs/:id (Detail)
│  │  └─ /procedures (Library)
│  │
│  ├─ Planning & Risk [Manager+]
│  │  ├─ /universe
│  │  ├─ /risks
│  │  └─ /plans
│  │
│  ├─ Tools
│  │  ├─ /tools/materiality [Senior+]
│  │  ├─ /tools/sampling [Internal]
│  │  ├─ /tools/confirmations [All Users]
│  │  └─ /tools/analytical-procedures [Internal]
│  │
│  ├─ Quality Control & Analytics [Senior+]
│  │  ├─ /quality-control
│  │  └─ /analytics
│  │
│  └─ Administration [Admin/Partner]
│     ├─ /admin (Dashboard)
│     └─ /admin/users (User Management)
│
└─ Error Handling
   └─ * (404 - NotFound)
```

