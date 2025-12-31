# Obsidian Audit - Routes Quick Reference

## One-Page Route Map

### Public Routes (No Auth)
```
GET  /                          → Index (Landing)
GET  /auth/login                → Login Page
GET  /auth/signup               → Signup Page
GET  /auth/forgot-password      → Password Reset
GET  /auth/accept-invite/:token → Accept Invite
GET  /auth/accept-firm-invite/:token → Accept Firm Invite
GET  /platform/ontology         → Platform Page
GET  /platform/audit            → Platform Page
GET  /platform/codex            → Platform Page
GET  /platform/forge            → Platform Page
GET  /contact                   → Contact Form
GET  *                          → 404 Not Found
```

### Workspace Core (Auth Required, All Roles)
```
GET  /workspace                 → Dashboard
GET  /dashboard                 → → /workspace (redirect)
GET  /inbox                     → Notifications (📍 badge)
GET  /clients                   → Clients
GET  /settings                  → User Settings
```

### Engagements (Auth Required, All Roles)
```
GET  /engagements               → List Engagements
GET  /engagements/:id           → Engagement Detail
GET  /engagements/:id/dashboard → Engagement Dashboard
GET  /engagements/:id/audit     → Audit Tab
GET  /engagements/:id/review    → Review Status
GET  /engagements/:engagementId/assign-procedures → Assign Procedures
GET  /engagements/templates     → Templates (🔒 Manager+)
GET  /engagements/approvals     → Approvals (🔒 Manager+, 📍 badge)
```

### My Work (Internal Roles)
```
GET  /my-procedures             → My Procedures (📍 badge)
GET  /tasks                     → Task Board (📍 badge)
GET  /review-queue              → Review Queue (🔒 Senior+, 📍 badge)
```

### Audit Execution (Internal Roles)
```
GET  /audits                    → Active Audits
GET  /audits/:auditId/workpapers → Audit Workpapers
GET  /workpapers                → Workpapers Hub
GET  /workpapers/:id            → Workpaper Editor
GET  /findings                  → Findings (📍 badge)
GET  /evidence                  → Evidence Library
GET  /information-requests      → Info Requests (📍 badge)
```

### Libraries (Internal Roles)
```
GET  /programs                  → Program Library
GET  /programs/:id              → Program Detail
GET  /procedures                → Procedure Library
```

### Tools (Auth Required, Various Roles)
```
GET  /tools/materiality         → Materiality Calculator (🔒 Senior+)
GET  /tools/sampling            → Sampling Calculator (🔒 Internal)
GET  /tools/confirmations       → Confirmations Tracker (📍 badge)
GET  /tools/analytical-procedures → Analytical Procedures (🔒 Internal)
```

### Planning & Risk (Manager+ Roles)
```
GET  /universe                  → Audit Universe (🔒 Manager+)
GET  /risks                     → Risk Assessments (🔒 Manager+)
GET  /plans                     → Audit Plans (🔒 Manager+)
```

### Quality & Analytics (Senior+ Roles)
```
GET  /quality-control           → QC Dashboard (🔒 Senior+, 📍 dot)
GET  /analytics                 → Analytics (🔒 Senior+)
```

### Administration (Admin/Partner)
```
GET  /admin                     → Admin Dashboard (🔒 Admin/Partner)
GET  /admin/users               → User Management (🔒 Admin/Partner)
```

### Legend
- 🔒 = Role-based access restriction
- 📍 = Has badge (count or indicator)

---

## Access Control Quick Lookup

### By Role

**All Authenticated Users:**
- /workspace, /inbox, /clients, /settings, /engagements*, /tools/confirmations

**Internal Roles** (staff_auditor, senior_auditor, engagement_manager, partner, practice_leader, firm_administrator, business_development):
- /my-procedures, /tasks, /audits, /workpapers*, /findings, /evidence, /information-requests
- /programs*, /procedures
- /tools/sampling, /tools/analytical-procedures

**Senior+ Roles** (senior_auditor, engagement_manager, partner, practice_leader, firm_administrator):
- /review-queue
- /quality-control, /analytics
- /tools/materiality

**Manager+ Roles** (engagement_manager, partner, practice_leader, firm_administrator):
- /universe, /risks, /plans
- /engagements/templates, /engagements/approvals

**Admin/Partner:**
- /admin, /admin/users

---

## Badge Items (Shows Notification Counts)

| Item | Route | Section | Type |
|------|-------|---------|------|
| My Procedures | /my-procedures | My Work | Count |
| Tasks | /tasks | My Work | Count |
| Review Queue | /review-queue | My Work | Count |
| Findings | /findings | Audit Execution | Count |
| Info Requests | /information-requests | Audit Execution | Count |
| Confirmations | /tools/confirmations | Tools & Libraries | Count |
| Approvals | /engagements/approvals | Engagements | Count |
| QC Dashboard | /quality-control | Quality & Analytics | Dot |

---

## Component & Guard Stack

Every protected route follows this pattern:

```
AppLayout (renders in Outlet)
  ↑
RequireRole Guard (optional)
  ↑
RequireAuth Guard
  ↑
Route
```

**Example: /my-procedures**
```tsx
<Route path="/my-procedures" element={
  <RequireAuth>
    <RequireRole>
      <AppLayout />
    </RequireRole>
  </RequireAuth>
}>
  <Route index element={<MyProcedures />} />
</Route>
```

---

## Sidebar Navigation Structure

### Auto-Collapsed Sections (Not in Sidebar by Default)
- Audit Execution
- Tools & Libraries
- Planning & Risk
- Quality & Analytics
- Administration

### Always Expanded
- Dashboard
- Engagements

### Expanded by Role
- My Work (Internal roles only)

---

## Router Setup Files

**Location:** `/src`

| File | Purpose |
|------|---------|
| `App.tsx` | Route definitions, guard wrapping |
| `config/navigation.ts` | Sidebar structure, role constants |
| `config/routeGuards.ts` | Route access rules |
| `components/AppLayout.tsx` | Main container layout |
| `components/AppSidebar.tsx` | Sidebar navigation |
| `components/guards/RequireAuth.tsx` | Auth check |
| `components/guards/RequireRole.tsx` | Role check |

---

## Common Routes by Use Case

### First-Time User Landing
1. `/auth/login` - Login
2. → `/auth/accept-invite/:token` - Accept invite (if applicable)
3. → `/workspace` - Main dashboard

### Staff Auditor Workflow
1. `/workspace` - Dashboard
2. `/my-procedures` - View assigned procedures
3. `/workpapers` - Document work
4. `/evidence` - Attach evidence
5. `/findings` - Log findings

### Manager Approval Flow
1. `/workspace` - Dashboard
2. `/engagements/approvals` - Review pending approvals
3. `/engagements/:id` - Review engagement
4. → Approve/Reject

### QC Reviewer Workflow
1. `/workspace` - Dashboard
2. `/review-queue` - Items awaiting review
3. `/workpapers/:id` - Review workpaper
4. `/findings` - Review findings
5. → Approve/Send back for revision

### Partner Planning
1. `/workspace` - Dashboard
2. `/universe` - Define audit universe
3. `/risks` - Risk assessment
4. `/plans` - Create audit plans
5. `/engagements` - Set up engagements
6. → Kick off audit execution

---

## Environment/Configuration Notes

**Demo Mode:** Currently disabled in `RequireAuth.tsx`
- To enable: Set `DEMO_MODE = true` in `src/components/guards/RequireAuth.tsx`
- Demo mode bypasses all authentication checks

**Sidebar State:** Persisted to localStorage
- Key: `sidebar-state`
- Stores boolean (open/closed)

**Port Redirect:** `/portal` automatically redirects to `/workspace`

