# Obsidian Audit - Complete Application Structure & Flow

## Part 1: Route Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx                                  │
│                   Route Configuration                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
    ┌─────────────┐            ┌──────────────────┐
    │   PUBLIC    │            │    PROTECTED     │
    │   Routes    │            │    Routes        │
    │             │            │                  │
    │ /           │            │ /workspace       │
    │ /auth/*     │            │ /engagements     │
    │ /platform/* │            │ /audits          │
    │ /contact    │            │ /my-procedures   │
    └─────────────┘            └────────┬─────────┘
                                        │
                                        ▼
                            ┌─────────────────────┐
                            │  RequireAuth Guard  │
                            │                     │
                            │ Checks AuthContext  │
                            │ - User exists?      │
                            │ - Token valid?      │
                            └────────┬────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
        ✓ Authenticated              ✗ Not Authenticated
                    │                                 │
                    ▼                                 ▼
         ┌──────────────────┐         ┌──────────────────┐
         │  RequireRole     │         │  /auth/login     │
         │  Guard (optional)│         │   (redirect)     │
         │                  │         └──────────────────┘
         │ Checks roles for │
         │ restricted routes│
         └────────┬─────────┘
                  │
    ┌─────────────┴──────────────┐
    │                            │
✓ Has Required Role    ✗ Missing Required Role
    │                            │
    ▼                            ▼
┌──────────────┐      ┌─────────────────┐
│  AppLayout   │      │ /workspace      │
│              │      │ (redirect)      │
│ Renders page │      │ or Error Page   │
│ in Outlet    │      │ (configurable)  │
└──────────────┘      └─────────────────┘
```

---

## Part 2: Complete Route Tree by Section

```
Application Root (/)
│
├─ [PUBLIC SECTION]
│  ├─ /                            Landing Page
│  ├─ /auth/login                  Login
│  ├─ /auth/signup                 Signup
│  ├─ /auth/forgot-password        Password Recovery
│  ├─ /auth/accept-invite/:token   Team Invitation
│  ├─ /auth/accept-firm-invite/:token  Firm Invitation
│  ├─ /platform/ontology           Product Info
│  ├─ /platform/audit              Product Info
│  ├─ /platform/codex              Product Info
│  ├─ /platform/forge              Product Info
│  └─ /contact                     Contact Form
│
├─ [PROTECTED: ALL AUTHENTICATED USERS]
│  ├─ /workspace                   Dashboard (home)
│  ├─ /dashboard                   └─ Redirects to /workspace
│  ├─ /inbox                       Notifications (Count badge)
│  ├─ /clients                     Client Management
│  ├─ /settings                    User Account Settings
│  │
│  ├─ ENGAGEMENTS SECTION
│  │  ├─ /engagements              List All
│  │  ├─ /engagements/:id          Detail View
│  │  ├─ /engagements/:id/dashboard Dashboard
│  │  ├─ /engagements/:id/audit    Audit Tab
│  │  ├─ /engagements/:id/review   Review Status
│  │  ├─ /engagements/:engagementId/assign-procedures
│  │  ├─ /engagements/templates    [🔒 MANAGER+]
│  │  └─ /engagements/approvals    [🔒 MANAGER+] (Count badge)
│  │
│  ├─ AUDIT TOOLS SECTION
│  │  ├─ /tools/confirmations      [All Users] (Count badge)
│  │  ├─ /tools/materiality        [🔒 SENIOR+]
│  │  ├─ /tools/sampling           [🔒 INTERNAL]
│  │  └─ /tools/analytical-procedures [🔒 INTERNAL]
│  │
│  └─ [PORTAL REDIRECT]
│     └─ /portal                   └─ Redirects to /workspace
│
├─ [PROTECTED: INTERNAL ROLES]
│  │  [staff_auditor, senior_auditor, engagement_manager,
│  │   partner, practice_leader, firm_administrator, business_development]
│  │
│  ├─ MY WORK SECTION
│  │  ├─ /my-procedures            My Assigned Tasks (Count badge)
│  │  ├─ /tasks                    Task Board (Count badge)
│  │  └─ /review-queue             [🔒 SENIOR+] (Count badge)
│  │
│  ├─ AUDIT EXECUTION SECTION
│  │  ├─ /audits                   Active Audits
│  │  ├─ /audits/:auditId/workpapers  Specific Audit WPs
│  │  ├─ /workpapers               Workpapers Hub
│  │  ├─ /workpapers/:id           Workpaper Editor
│  │  ├─ /findings                 Findings Management (Count badge)
│  │  ├─ /evidence                 Evidence Library
│  │  └─ /information-requests     Client Info Requests (Count badge)
│  │
│  ├─ LIBRARIES SECTION
│  │  ├─ /programs                 Program Library
│  │  ├─ /programs/:id             Program Detail
│  │  └─ /procedures               Procedure Library
│  │
│  └─ [INTERNAL ONLY - RESTRICTED]
│     ├─ /universe                 [🔒 MANAGER+] Audit Universe
│     ├─ /risks                    [🔒 MANAGER+] Risk Assessments
│     ├─ /plans                    [🔒 MANAGER+] Audit Plans
│     ├─ /quality-control          [🔒 SENIOR+] QC Dashboard (Dot badge)
│     └─ /analytics                [🔒 SENIOR+] Analytics
│
└─ [PROTECTED: ADMIN/PARTNER ONLY]
   ├─ /admin                       Admin Dashboard
   ├─ /admin/users                 User Management
   │
   └─ [ERROR HANDLING]
      └─ * (all undefined)         404 Not Found Page
```

Legend: 🔒 = Role-restricted access

---

## Part 3: Sidebar Navigation Layout

```
┌─────────────────────────────────────────────┐
│         SIDEBAR (Collapsible)               │
│                                             │
├─────────────────────────────────────────────┤
│  HEADER                                     │
│  ┌───────────────────────────────────────┐ │
│  │ Firm Switcher / Tenant Selector       │ │
│  ├───────────────────────────────────────┤ │
│  │ User First Last             [ROLE]    │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  CONTENT                                    │
│                                             │
│  ═══ Dashboard (Non-Collapsible) ═══       │
│  📊 Dashboard                  /workspace   │
│                                             │
│  ═══ My Work (Collapsible) ═══              │
│  ┌─────────────────────────────────────┐   │
│  │ [▼] My Work [Internal Roles]        │   │
│  │   ✓ My Procedures (📍 count)        │   │
│  │   ✓ Tasks (📍 count)                │   │
│  │   ✓ Time Tracking                   │   │
│  │   ✓ Review Queue (📍 count)         │   │
│  │     [🔒 Senior+]                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ═══ Engagements (Collapsible) ═════        │
│  ┌─────────────────────────────────────┐   │
│  │ [▼] Engagements [All Users]         │   │
│  │   ✓ Active Engagements              │   │
│  │   ✓ Clients                         │   │
│  │   ✓ Templates [🔒 Manager+]         │   │
│  │   ✓ Approvals [🔒 Manager+]         │   │
│  │     (📍 count)                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ═══ Audit Execution (Collapsed) ═══        │
│  ┌─────────────────────────────────────┐   │
│  │ [▶] Audit Execution [Internal]      │   │
│  │   (expands to show: Workpapers,    │   │
│  │    Findings, Evidence, Requests)   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ═══ Tools & Libraries (Collapsed) ═════    │
│  ┌─────────────────────────────────────┐   │
│  │ [▶] Tools & Libraries [Internal]    │   │
│  │   (expands to show: Programs,      │   │
│  │    Procedures, Materiality,        │   │
│  │    Sampling, Analytical, etc)      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ═══ Planning & Risk (Collapsed) ═════      │
│  ┌─────────────────────────────────────┐   │
│  │ [▶] Planning & Risk [Manager+]      │   │
│  │   (expands to: Universe, Risks,    │   │
│  │    Plans)                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ═══ Quality & Analytics (Collapsed) ══     │
│  ┌─────────────────────────────────────┐   │
│  │ [▶] Quality & Analytics [Senior+]   │   │
│  │   (expands to: QC Dashboard,       │   │
│  │    Analytics)                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ═══ Administration (Collapsed) ═════       │
│  ┌─────────────────────────────────────┐   │
│  │ [▶] Admin [Firm Admin Only]         │   │
│  │   (expands to: Users, Team,        │   │
│  │    Settings)                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
│  [⚙️] Settings      [🚪] Sign Out           │
└─────────────────────────────────────────────┘
```

---

## Part 4: Component Hierarchy

```
<App>
  └─ <BrowserRouter>
     └─ <Routes>
        │
        ├─ <Route path="/" element={<Index />} />               [PUBLIC]
        ├─ <Route path="/auth/*" element={<LoginPage />} />    [PUBLIC]
        ├─ <Route path="/platform/*" element={<ProductPage />} /> [PUBLIC]
        │
        └─ <Route path="/workspace" element={
             <RequireAuth>
               <AppLayout>
                 <Outlet />
               </AppLayout>
             </RequireAuth>
           }>
             <Route index element={<MyWorkspace />} />
           </Route>
           
           [Protected Routes - All require <RequireAuth>]
           
           <Route path="/my-procedures" element={
             <RequireAuth>
               <RequireRole allowedRoles={INTERNAL_ROLES}>
                 <AppLayout>
                   <Outlet />
                 </AppLayout>
               </RequireRole>
             </RequireAuth>
           }>
             <Route index element={<MyProcedures />} />
           </Route>
           
           [Similar pattern for all protected routes...]
           
           └─ <Route path="*" element={<NotFound />} />       [ERROR]
```

---

## Part 5: Authentication & Authorization Pipeline

```
User Request
    │
    ▼
┌──────────────────────┐
│ Is route public?     │
└──────┬───────────────┘
       │
   ┌───┴────┬───────────┐
   │        │           │
  YES       NO          │
   │        │           │
   │        ▼           │
   │    ┌──────────────────────────┐
   │    │ RequireAuth Guard         │
   │    │                           │
   │    │ Check: User exists?       │
   │    │ Check: Token valid?       │
   │    └──────┬─────────┬──────────┘
   │           │         │
   │        ✓  │         │  ✗
   │           │         │
   │           │         ▼
   │           │    ┌──────────────────┐
   │           │    │ Redirect to      │
   │           │    │ /auth/login      │
   │           │    └──────────────────┘
   │           │
   │           ▼
   │        ┌──────────────────────────┐
   │        │ RequireRole Guard         │
   │        │                           │
   │        │ Is role-based route?      │
   │        └──────┬──────────┬─────────┘
   │               │          │
   │            ✓  │          │  ✗
   │               │          │
   │               │          ▼
   │               │    ┌──────────────────┐
   │               │    │ Redirect to      │
   │               │    │ /workspace       │
   │               │    │ (or error page)  │
   │               │    └──────────────────┘
   │               │
   │               ▼
   │        ┌──────────────────────────┐
   │        │ AppLayout Component      │
   │        │                          │
   │        │ ┌────────────────────┐   │
   │        │ │ Header             │   │
   │        │ ├────────────────────┤   │
   │        │ │ Sidebar            │   │
   │        │ ├────────────────────┤   │
   │        │ │ Main Content Area  │   │
   │        │ │ <Outlet />         │   │
   │        │ └────────────────────┘   │
   │        └──────┬───────────────────┘
   │               │
   │               ▼
   │        ┌──────────────────────────┐
   │        │ Page Component Rendered  │
   │        │ (e.g., <MyProcedures />)│
   │        └──────────────────────────┘
   │
   └────────────────────────────────────┐
        Route Renders Directly           │
        (Public Route)                   │
        └───────────────────────────────┘
```

---

## Part 6: Guard Implementation Details

### RequireAuth Guard Logic

```typescript
const RequireAuth = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth/login" />;
  
  return children;
};
```

### RequireRole Guard Logic

```typescript
const RequireRole = ({ children, allowedRoles }) => {
  const { user, roles, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  // Get roles from explicit prop or route config
  const requiredRoles = allowedRoles || getRequiredRoles(location.pathname);

  // No roles required = open route
  if (requiredRoles.length === 0) return children;

  // Check if user has required role
  const hasPermission = roles.some(role => requiredRoles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/workspace" />;
    // or <UnauthorizedPage /> if showUnauthorized={true}
  }

  return children;
};
```

---

## Part 7: Badge System Architecture

```
Navigation Item has badge property?
    │
    ├─ badge: 'count'
    │  │
    │  └─ useNavigationBadges() hook
    │     │
    │     └─ Fetches from API/store
    │        │
    │        ├─ My Procedures count
    │        ├─ Tasks count
    │        ├─ Review Queue count
    │        ├─ Findings count
    │        ├─ Info Requests count
    │        ├─ Confirmations count
    │        └─ Approvals count
    │
    └─ badge: 'dot'
       │
       └─ QC Dashboard status indicator
          │
          └─ Shows warning/error state
```

---

## Part 8: Role Hierarchy

```
┌──────────────────────────────────────────────────┐
│           ROLE HIERARCHY & PERMISSIONS            │
└──────────────────────────────────────────────────┘

                  FIRM_ADMINISTRATOR
                   (System Admin)
                    │
         ┌──────────┼──────────┐
         │          │          │
        PARTNER    PRACTICE   ENGAGEMENT
                   LEADER     MANAGER
         │          │          │
         ├──────────┼──────────┤
         │          │          │
    SENIOR_AUDITOR + STAFF_AUDITOR
         │              │
         └──────┬───────┘
                │
          BUSINESS_DEVELOPMENT


INTERNAL_ROLES = {
  staff_auditor,
  senior_auditor,
  engagement_manager,
  partner,
  practice_leader,
  firm_administrator,
  business_development
}

SENIOR+ = {
  senior_auditor,
  engagement_manager,
  partner,
  practice_leader,
  firm_administrator
}

MANAGER+ = {
  engagement_manager,
  partner,
  practice_leader,
  firm_administrator
}

ADMIN = {
  firm_administrator
}
```

---

## Part 9: Data Flow for Badge Updates

```
User navigates to /workspace
    │
    ▼
MyWorkspace component mounts
    │
    ▼
useNavigationBadges() hook triggers
    │
    ▼
Fetch badge counts for:
├─ My Procedures → /my-procedures
├─ Tasks → /tasks
├─ Review Queue → /review-queue
├─ Findings → /findings
├─ Info Requests → /information-requests
├─ Confirmations → /tools/confirmations
└─ Approvals → /engagements/approvals
    │
    ▼
Store counts in state/cache
    │
    ▼
Sidebar re-renders with badge counts
    │
    ▼
User sees notification badges
    │
    ▼
User clicks navigation item
    │
    ▼
Counts update in real-time
```

---

## Part 10: Configuration File Dependencies

```
App.tsx
  ├─ imports: RequireAuth, RequireRole
  ├─ imports: AppLayout
  └─ uses: routeGuards (indirectly through guards)

AppLayout.tsx
  ├─ imports: AppSidebar
  ├─ imports: AppSwitcher
  ├─ imports: NotificationsDropdown
  └─ imports: TimeTrackingWidget

AppSidebar.tsx
  ├─ imports: navigation.ts (sidebarNavigation)
  ├─ imports: useNavigationBadges
  ├─ imports: CollapsibleNavSection
  └─ filters sections by user roles

config/navigation.ts
  ├─ defines: INTERNAL_ROLES, SENIOR_PLUS_ROLES, MANAGER_PLUS_ROLES
  ├─ defines: sidebarNavigation structure
  ├─ defines: NavigationSection interface
  ├─ defines: NavSectionItem interface
  └─ exports: helper functions (filterNavigationByRole, etc)

config/routeGuards.ts
  ├─ defines: RouteGuard interface
  ├─ defines: routeGuards array
  ├─ imports: role constants from navigation.ts
  └─ exports: findRouteGuard(), hasRouteAccess(), getRequiredRoles()

components/guards/RequireAuth.tsx
  ├─ uses: AuthContext
  └─ logic: checks if user exists

components/guards/RequireRole.tsx
  ├─ uses: AuthContext
  ├─ uses: findRouteGuard from config/routeGuards.ts
  └─ logic: checks if user has required role
```

---

## Summary

This application uses a comprehensive **3-layer security model**:

1. **Layer 1: Public vs Protected Routes** - Basic auth requirement
2. **Layer 2: Role-Based Access** - Specific role requirements per route
3. **Layer 3: Navigation Filtering** - Sidebar items shown/hidden based on roles

All configuration is centralized in `config/` directory for easy maintenance and updates.

