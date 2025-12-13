# Security Implementation Guide

This guide provides step-by-step instructions for implementing the role-based access control enhancements identified in the security audit.

## Quick Start

### 1. Using Route Guards

Protect routes that require specific roles:

```typescript
// App.tsx
import { RequireRole } from "@/components/guards/RequireRole";

// Protect analytics routes (partners and admins only)
<Route path="/analytics/firm" element={
  <RequireAuth>
    <RequireRole allowedRoles={['partner', 'firm_administrator', 'practice_leader']}>
      <AppLayout />
    </RequireRole>
  </RequireAuth>
}>
  <Route index element={<FirmAnalytics />} />
</Route>

// Protect user management (admins only)
<Route path="/admin/users" element={
  <RequireAuth>
    <RequireRole allowedRoles={['firm_administrator', 'partner']}>
      <AppLayout />
    </RequireRole>
  </RequireAuth>
}>
  <Route index element={<UserManagement />} />
</Route>
```

### 2. Using Permission Checks in Components

Conditionally render UI elements based on permissions:

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function EngagementDetail() {
  const { can, isAdmin } = usePermissions();

  return (
    <div>
      {/* Show delete button only to admins */}
      {can('delete', 'engagement') && (
        <Button variant="destructive" onClick={handleDelete}>
          Delete Engagement
        </Button>
      )}

      {/* Show approval button only to managers */}
      {can('approve', 'report') && (
        <Button onClick={handleApprove}>
          Approve Report
        </Button>
      )}

      {/* Show admin-only section */}
      {isAdmin() && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Admin-only content */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 3. Using Role Checks

Check if user has specific roles:

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function Dashboard() {
  const { hasRole, hasAnyRole, isManager } = usePermissions();

  return (
    <div>
      {/* Content for partners only */}
      {hasRole('partner') && (
        <PartnerDashboardWidget />
      )}

      {/* Content for managers (any manager role) */}
      {isManager() && (
        <ManagerControls />
      )}

      {/* Content for specific roles */}
      {hasAnyRole(['partner', 'practice_leader']) && (
        <LeadershipMetrics />
      )}
    </div>
  );
}
```

## Complete Implementation Checklist

### Phase 1: Critical Routes (Priority 1)

Add `RequireRole` guards to these routes:

- [ ] Analytics routes
  ```typescript
  <Route path="/analytics/*" element={
    <RequireAuth>
      <RequireRole allowedRoles={['partner', 'firm_administrator', 'practice_leader']}>
        <AppLayout />
      </RequireRole>
    </RequireAuth>
  }>
  ```

- [ ] User management
  ```typescript
  <Route path="/admin/users" element={
    <RequireAuth>
      <RequireRole allowedRoles={['firm_administrator', 'partner']}>
        <AppLayout />
      </RequireRole>
    </RequireAuth>
  }>
  ```

- [ ] Billing/invoices
  ```typescript
  <Route path="/billing/*" element={
    <RequireAuth>
      <RequireRole allowedRoles={['firm_administrator', 'partner']}>
        <AppLayout />
      </RequireRole>
    </RequireAuth>
  }>
  ```

### Phase 2: Page-Level Permissions (Priority 2)

Add permission checks to action buttons:

- [ ] **EngagementList** (`src/pages/engagement/EngagementList.tsx`)
  - Create button: `can('create', 'engagement')`
  - Delete button: `can('delete', 'engagement')`

- [ ] **ClientList** (`src/pages/crm/ClientList.tsx`)
  - Create button: `can('create', 'client')`
  - Edit button: `can('edit', 'client')`
  - Delete button: `can('delete', 'client')`

- [ ] **ReportsList** (`src/pages/reports/ReportsList.tsx`)
  - Generate button: `can('generate', 'report')`
  - Approve button: `can('approve', 'report')`
  - Deliver button: `can('deliver', 'report')`

- [ ] **UserManagement** (`src/pages/admin/UserManagement.tsx`)
  - Invite button: `can('create', 'user')`
  - Assign roles: `can('assign', 'roles')`
  - Deactivate: `can('deactivate', 'user')`

- [ ] **TimesheetApproval** (`src/pages/time/TimesheetApproval.tsx`)
  - Approve button: `can('approve', 'timesheet')`

### Phase 3: Data Query Hardening (Priority 3)

Add explicit filters to client portal queries:

- [ ] **ClientPortalDashboard** - Add `client_id` filter
- [ ] **ClientEngagements** - Add `client_id` filter
- [ ] **ClientDocuments** - Add `client_id` filter
- [ ] **ClientInvoices** - Add `client_id` filter
- [ ] **ClientRequests** - Add `client_id` filter

Example implementation:

```typescript
// BEFORE (relies only on RLS)
const { data } = await supabase
  .from('audits')
  .select('*');

// AFTER (explicit filter + RLS)
const { data } = await supabase
  .from('audits')
  .select('*')
  .eq('client_id', userClientId); // ✅ Defense-in-depth
```

## Usage Examples by Role

### Firm Administrator
```typescript
const { can, isAdmin } = usePermissions();

can('create', 'user')            // ✅ true
can('delete', 'engagement')      // ✅ true
can('approve', 'report')         // ✅ true
can('view_firm_analytics')       // ✅ true
isAdmin()                        // ✅ true
```

### Partner
```typescript
const { can, isAdmin } = usePermissions();

can('create', 'user')            // ✅ true
can('delete', 'engagement')      // ✅ true
can('approve', 'report')         // ✅ true
can('view_firm_analytics')       // ✅ true
isAdmin()                        // ✅ true
```

### Engagement Manager
```typescript
const { can, isManager } = usePermissions();

can('create', 'engagement')      // ✅ true
can('delete', 'engagement')      // ❌ false
can('approve', 'timesheet')      // ✅ true
can('approve', 'report')         // ❌ false
isManager()                      // ✅ true
```

### Senior Auditor
```typescript
const { can } = usePermissions();

can('create', 'workpaper')       // ✅ true
can('review', 'workpaper')       // ✅ true
can('delete', 'workpaper')       // ❌ false
can('approve', 'report')         // ❌ false
```

### Staff Auditor
```typescript
const { can } = usePermissions();

can('create', 'workpaper')       // ✅ true
can('review', 'workpaper')       // ❌ false
can('delete', 'workpaper')       // ❌ false
can('approve', 'timesheet')      // ❌ false
```

## Advanced Patterns

### Combining Multiple Checks

```typescript
const { can, hasAnyRole } = usePermissions();

// User must be manager AND have approval permission
{isManager() && can('approve', 'report') && (
  <ApprovalButtons />
)}

// User can either be admin OR have specific permission
{(isAdmin() || can('view', 'billing')) && (
  <BillingDashboard />
)}
```

### Loading States

```typescript
const { isLoading, can } = usePermissions();

if (isLoading) {
  return <LoadingSpinner />;
}

return (
  <div>
    {can('create', 'engagement') && (
      <CreateEngagementButton />
    )}
  </div>
);
```

### Role-Specific Navigation

```typescript
const { hasRole, isManager } = usePermissions();

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', show: true },
  { label: 'Engagements', path: '/engagements', show: true },
  { label: 'Analytics', path: '/analytics/firm', show: isManager() },
  { label: 'User Management', path: '/admin/users', show: hasRole('firm_administrator') },
];

return (
  <nav>
    {navigationItems.filter(item => item.show).map(item => (
      <NavLink key={item.path} to={item.path}>
        {item.label}
      </NavLink>
    ))}
  </nav>
);
```

## Testing Permissions

### Test with Different Roles

```typescript
// In development, you can test different role behaviors by:

// 1. Creating test users with different roles in Supabase
// 2. Logging in as each test user
// 3. Verifying:
//    - Correct routes are accessible
//    - Correct buttons are visible
//    - Correct actions are allowed

// Test matrix:
const testScenarios = [
  { role: 'partner', shouldSee: ['analytics', 'user_mgmt', 'billing'] },
  { role: 'engagement_manager', shouldSee: ['engagements', 'approval'] },
  { role: 'staff_auditor', shouldSee: ['workpapers', 'time_entry'] },
  { role: 'client_user', shouldSee: ['portal_dashboard', 'documents'] },
];
```

## Troubleshooting

### Permission Check Returns False Unexpectedly

1. **Check user has correct role in database**
   ```sql
   SELECT * FROM user_roles WHERE user_id = '<user_id>';
   ```

2. **Verify permission is defined**
   ```typescript
   // Check PERMISSIONS object in usePermissions.ts
   const PERMISSIONS = {
     'action_resource': ['required_role'],
   };
   ```

3. **Check role name spelling**
   ```typescript
   // Roles must match exactly (case-sensitive)
   hasRole('firm_administrator')  // ✅ correct
   hasRole('Firm_Administrator')  // ❌ wrong
   ```

### Route Guard Not Working

1. **Ensure RequireAuth is parent of RequireRole**
   ```typescript
   // ✅ Correct
   <RequireAuth>
     <RequireRole allowedRoles={['partner']}>
       <Page />
     </RequireRole>
   </RequireAuth>

   // ❌ Wrong
   <RequireRole allowedRoles={['partner']}>
     <RequireAuth>
       <Page />
     </RequireAuth>
   </RequireRole>
   ```

2. **Check role array contains correct values**
   ```typescript
   allowedRoles={['partner']}  // ✅ array of strings
   allowedRoles="partner"      // ❌ not an array
   ```

### Performance Concerns

If permission checks are slow:

1. **Use role caching** (already implemented in hook)
2. **Avoid excessive permission checks in render**
   ```typescript
   // ❌ Bad - checks permission for every item
   {items.map(item => (
     can('edit', 'item') && <EditButton />
   ))}

   // ✅ Good - check once
   const canEdit = can('edit', 'item');
   {items.map(item => (
     canEdit && <EditButton />
   ))}
   ```

## Migration Path

### Gradual Rollout

Implement security enhancements in stages:

**Week 1:**
- ✅ Add RequireRole to analytics routes
- ✅ Add RequireRole to admin routes
- ✅ Test with different user roles

**Week 2:**
- ✅ Add permission checks to create/delete buttons
- ✅ Add permission checks to approval workflows
- ✅ Update client portal queries with explicit filters

**Week 3:**
- ✅ Add permission checks to all remaining actions
- ✅ Add role-based navigation
- ✅ Full QA testing across all roles

**Week 4:**
- ✅ Monitor for permission errors
- ✅ Fix any edge cases
- ✅ Document any custom permissions

## Best Practices

1. **Always use both RLS and application-level checks** (defense-in-depth)
2. **Hide UI elements user can't use** (better UX than showing disabled buttons)
3. **Use descriptive permission names** (`can('approve', 'report')` not `can('action1', 'type2')`)
4. **Check permissions at route level AND action level**
5. **Test with real user accounts**, not just admin accounts
6. **Document custom permissions** in the PERMISSIONS object
7. **Use TypeScript** to catch permission typos at compile time
8. **Log permission denials** for security monitoring

## Additional Resources

- **Security Architecture**: See `SECURITY_AND_DATA_FLOW.md`
- **RLS Policies**: See `supabase/migrations/*.sql`
- **Role Definitions**: See `src/types/roles.ts` (if exists)
- **Supabase RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

**Last Updated**: 2025-01-23
**Status**: Implementation Ready
