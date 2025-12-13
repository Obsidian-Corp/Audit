# Security Architecture & Data Flow Documentation

## Executive Summary

This document provides a comprehensive analysis of the audit management platform's security architecture, data flow between modules, role-based access control (RBAC), and multi-tenant data isolation.

**Overall Security Posture: GOOD with identified gaps requiring attention**

---

## Table of Contents

1. [Multi-Tenant Architecture](#multi-tenant-architecture)
2. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
3. [Data Flow Between Modules](#data-flow-between-modules)
4. [Database-Level Security (RLS Policies)](#database-level-security-rls-policies)
5. [Application-Level Security](#application-level-security)
6. [Security Gaps & Recommendations](#security-gaps--recommendations)

---

## Multi-Tenant Architecture

### Tenant Isolation Strategy

The platform uses **firm-level multi-tenancy** with the following isolation mechanisms:

#### 1. Database Level
- **Primary Key**: `firm_id` column on all major tables
- **Foreign Key Constraints**: Cascade deletes ensure data integrity
- **Row-Level Security (RLS)**: Supabase RLS policies enforce firm isolation

#### 2. Application Level
- **OrganizationContext**: React context provides `currentOrg` for all queries
- **Authentication**: Separate auth systems for internal users vs platform admins vs client users

### Firm Hierarchy

```
Platform
├── Firm A (firm_id: uuid-1)
│   ├── Users (via user_roles)
│   ├── Clients
│   ├── Engagements (Audits)
│   ├── Reports
│   └── Invoices
├── Firm B (firm_id: uuid-2)
│   └── [Same structure]
└── Platform Admins (separate schema: platform_admin)
```

**✅ SECURE**: Database RLS policies prevent cross-firm data access
**✅ SECURE**: Application queries filter by `firm_id` from `currentOrg`

---

## Role-Based Access Control (RBAC)

### User Roles

The platform supports **9 distinct roles** across 3 authentication domains:

#### Internal Firm Roles (7 roles)
1. **firm_administrator** - Full firm management access
2. **partner** - Executive-level access, firm-wide visibility
3. **practice_leader** - Practice area management
4. **engagement_manager** - Engagement creation and oversight
5. **senior_auditor** - Senior fieldwork execution
6. **staff_auditor** - Junior fieldwork execution
7. **business_development** - CRM and opportunity management

#### Client Roles (2 roles)
8. **client_administrator** - Client company admin
9. **client_user** - Regular client user

#### Platform Roles (separate system)
- **platform_admin** - System-wide administrative access

### Role Storage

Roles are stored in the `user_roles` table:

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id),
  firm_id UUID REFERENCES firms(id),
  role TEXT NOT NULL,
  client_id UUID REFERENCES clients(id), -- Only for client roles
  UNIQUE(user_id, firm_id, role)
);
```

---

## Data Flow Between Modules

### Module Interconnections

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLATFORM DATA FLOW                          │
└─────────────────────────────────────────────────────────────────┘

[Module 02: User Management]
    ├─> Creates users with roles
    └─> Feeds ALL modules (authentication)
         │
         ▼
[Module 03: CRM & Clients]
    ├─> Creates clients
    ├─> Creates opportunities
    └─> Feeds:
         ├─> Module 04 (Engagements)
         ├─> Module 08 (Invoicing)
         └─> Module 09 (Client Portal)
         │
         ▼
[Module 04: Engagement Management]
    ├─> Creates engagements (audits table)
    ├─> Assigns team members (engagement_team table)
    └─> Feeds:
         ├─> Module 05 (Audit Programs)
         ├─> Module 06 (Fieldwork)
         ├─> Module 07 (Reports)
         ├─> Module 08 (Time & Billing)
         └─> Module 10 (Resource Management)
         │
         ▼
[Module 05: Audit Programs & Procedures]
    ├─> Creates procedure templates
    ├─> Assigns procedures to engagements
    └─> Feeds:
         └─> Module 06 (Fieldwork execution)
         │
         ▼
[Module 06: Fieldwork Execution]
    ├─> Creates workpapers
    ├─> Collects evidence
    ├─> Documents findings
    ├─> Manages information requests
    └─> Feeds:
         ├─> Module 07 (Report generation)
         └─> Module 08 (Time tracking)
         │
         ▼
[Module 07: Reports]
    ├─> Generates reports from findings
    ├─> Manages report approval workflow
    └─> Feeds:
         ├─> Module 09 (Client portal delivery)
         └─> Module 08 (Invoicing trigger)
         │
         ▼
[Module 08: Time Tracking & Billing]
    ├─> Tracks time on engagements
    ├─> Creates invoices for clients
    └─> Feeds:
         ├─> Module 09 (Client invoice viewing)
         ├─> Module 10 (Utilization tracking)
         └─> Module 11 (Revenue analytics)
         │
         ▼
[Module 09: Client Portal]
    ├─> Displays client engagements
    ├─> Shows documents and reports
    ├─> Displays invoices
    └─> Receives information request responses
         │
         ▼
[Module 10: Resource Management]
    ├─> Tracks team allocation
    ├─> Monitors utilization
    └─> Feeds:
         └─> Module 11 (Analytics)
         │
         ▼
[Module 11: Analytics & Reporting]
    ├─> Aggregates data from ALL modules
    ├─> Calculates KPIs
    └─> Provides executive dashboards
```

### Key Data Relationships

| Source Module | Target Module | Data Entity | Relationship |
|--------------|---------------|-------------|--------------|
| CRM (03) | Engagements (04) | `clients.id` → `audits.client_id` | One-to-many |
| Engagements (04) | Fieldwork (06) | `audits.id` → `audit_workpapers.audit_id` | One-to-many |
| Fieldwork (06) | Reports (07) | `audit_findings.id` → `report_findings` | Many-to-many |
| Engagements (04) | Time & Billing (08) | `audits.id` → `time_entries.audit_id` | One-to-many |
| CRM (03) | Time & Billing (08) | `clients.id` → `invoices.client_id` | One-to-many |
| User Mgmt (02) | Resources (10) | `profiles.id` → `engagement_team.user_id` | One-to-many |
| All Modules | Analytics (11) | Aggregation queries | Read-only |

---

## Database-Level Security (RLS Policies)

### RLS Policy Coverage

**✅ IMPLEMENTED** - The following tables have comprehensive RLS policies:

#### Core Tables
- ✅ `firms` - Users see only their firm
- ✅ `profiles` - Users see firm members
- ✅ `user_roles` - Controlled by firm admins

#### Audit/Engagement Tables
- ✅ `audits` - Firm members see firm audits OR assigned engagements
- ✅ `audit_workpapers` - Users see assigned workpapers
- ✅ `audit_findings` - Users see assigned findings
- ✅ `audit_evidence` - Users see assigned evidence
- ✅ `audit_reports` - Users see assigned reports
- ✅ `engagement_assignments` - Users see own assignments
- ✅ `engagement_team` - Firm-level isolation

#### CRM Tables
- ✅ `clients` - Firm members see firm clients
- ✅ `client_contacts` - Via client firm relationship
- ✅ `opportunities` - Firm-level isolation
- ✅ `client_meetings` - Via client firm relationship
- ✅ `client_documents` - Via client firm relationship

#### Time & Billing Tables
- ✅ `time_entries` - Users see own + managers see team
- ✅ `invoices` - Firm-level isolation

### Sample RLS Policy (Audits)

```sql
-- Users can see audits from their firm OR engagements they're assigned to
CREATE POLICY "Firm members see firm audits"
ON audits FOR SELECT TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  OR id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
);

-- Only partners/admins can manage all firm audits
CREATE POLICY "Partners manage all firm audits"
ON audits FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND firm_id = audits.firm_id
    AND role IN ('firm_administrator', 'partner')
  )
);

-- Managers can create new audits
CREATE POLICY "Managers create audits"
ON audits FOR INSERT TO authenticated
WITH CHECK (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND firm_id = audits.firm_id
    AND role IN ('firm_administrator', 'partner', 'engagement_manager', 'business_development')
  )
);
```

**Security Strength**: Database-level policies ensure even direct SQL access respects permissions.

---

## Application-Level Security

### Current Implementation

#### 1. Route Guards

| Guard | Purpose | Roles Checked | Status |
|-------|---------|---------------|--------|
| `RequireAuth` | Basic authentication | Any authenticated user | ✅ Implemented |
| `PlatformAdminGuard` | Platform admin routes | Platform admin session | ✅ Implemented |
| `ClientPortalGuard` | Client portal routes | `client_administrator`, `client_user` | ✅ Implemented |
| **Role-specific guards** | Granular internal role checks | Partner, Manager, etc. | ❌ **MISSING** |

#### 2. Data Access Patterns

**✅ SECURE Pattern** (used in most queries):
```typescript
const { data } = await supabase
  .from('audits')
  .select('*')
  .eq('firm_id', currentOrg.id); // ✅ Firm isolation
```

**✅ SECURE Pattern** (RLS handles isolation):
```typescript
// RLS automatically filters by user's firm/assignments
const { data } = await supabase
  .from('audits')
  .select('*'); // ✅ RLS enforces firm_id filter
```

#### 3. Client Portal Isolation

**✅ SECURE** - Client portal implements dual-layer security:

1. **Guard Level**: `ClientPortalGuard` verifies client roles
2. **Query Level**: Filters by `client_id` from user's `user_roles`

```typescript
// Example from ClientPortalDashboard
const { data: userRoles } = await supabase
  .from('user_roles')
  .select('client_id')
  .eq('user_id', user.id)
  .in('role', ['client_administrator', 'client_user'])
  .single();

const clientId = userRoles?.client_id;

// All subsequent queries filter by this client_id
const { data: engagements } = await supabase
  .from('audits')
  .select('*')
  .eq('client_id', clientId); // ✅ Client isolation
```

---

## Security Gaps & Recommendations

### 🔴 Critical Gaps

#### 1. Missing Role-Based Route Guards

**Issue**: While RLS policies enforce database-level security, application routes don't verify role permissions.

**Risk**: Staff auditors could access partner-level analytics pages (UI would load, but RLS would block data)

**Impact**: Poor UX, potential information disclosure in error messages

**Recommendation**: Implement role-based guards

```typescript
// src/components/guards/RequireRole.tsx
export function RequireRole({
  children,
  allowedRoles
}: {
  children: ReactNode;
  allowedRoles: string[]
}) {
  const { user } = useAuth();
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    checkRole();
  }, [user]);

  const checkRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .in('role', allowedRoles);

    setHasRole(data && data.length > 0);
  };

  if (hasRole === null) return <Loading />;
  if (!hasRole) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
}
```

**Usage**:
```typescript
<Route path="/analytics/*" element={
  <RequireAuth>
    <RequireRole allowedRoles={['partner', 'firm_administrator', 'practice_leader']}>
      <AppLayout />
    </RequireRole>
  </RequireAuth>
}>
```

---

#### 2. Missing Action-Level Permission Checks

**Issue**: UI doesn't conditionally hide actions based on user role

**Risk**: Staff auditors see "Delete" buttons that will fail when clicked

**Recommendation**: Create permission hooks

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const [roles, setRoles] = useState<string[]>([]);

  const can = (action: string, resource: string): boolean => {
    const permissions = {
      'delete_engagement': ['partner', 'firm_administrator'],
      'approve_timesheet': ['partner', 'engagement_manager', 'practice_leader'],
      'manage_users': ['firm_administrator', 'partner'],
      'create_invoice': ['partner', 'firm_administrator'],
      'approve_report': ['partner', 'engagement_manager'],
      // ... more permissions
    };

    const requiredRoles = permissions[`${action}_${resource}`] || [];
    return roles.some(role => requiredRoles.includes(role));
  };

  return { can, roles };
};
```

**Usage**:
```typescript
const { can } = usePermissions();

{can('delete', 'engagement') && (
  <Button variant="destructive" onClick={handleDelete}>
    Delete
  </Button>
)}
```

---

#### 3. Client Data Leakage Risk in Queries

**Issue**: Some queries in client portal don't explicitly filter by `client_id`

**Current**:
```typescript
// ClientDocuments.tsx - relies on RLS
const { data } = await supabase
  .from('client_documents')
  .select('*');
```

**Recommendation**: Always explicitly filter for defense-in-depth

```typescript
// ClientDocuments.tsx - explicit filter
const { data } = await supabase
  .from('client_documents')
  .select('*')
  .eq('client_id', userClientId); // ✅ Explicit filter
```

---

### 🟡 Medium Priority Gaps

#### 4. Missing Audit Logging

**Issue**: No centralized audit log for sensitive actions

**Recommendation**: Implement audit logging table

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  firm_id UUID REFERENCES firms(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  resource_type TEXT NOT NULL, -- 'engagement', 'invoice', 'report'
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 5. Missing Rate Limiting

**Issue**: No API rate limiting on expensive queries (analytics)

**Recommendation**: Implement Supabase Edge Functions with rate limiting for analytics endpoints

---

#### 6. Missing Data Retention Policies

**Issue**: No automated data cleanup or archival

**Recommendation**: Implement soft deletes and archival policies

```sql
ALTER TABLE audits ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE audits ADD COLUMN archived_at TIMESTAMPTZ;

-- Archive audits older than 7 years
CREATE POLICY "Hide archived audits" ON audits FOR SELECT
USING (archived_at IS NULL OR
       archived_at > NOW() - INTERVAL '7 years');
```

---

### 🟢 Low Priority Enhancements

#### 7. Missing MFA Support

**Recommendation**: Implement Supabase MFA for sensitive roles (partners, firm admins)

#### 8. Missing IP Whitelisting

**Recommendation**: Add IP whitelisting for platform admin access

#### 9. Missing Session Management

**Recommendation**: Implement session timeout and concurrent session limits

---

## Role-Based Access Matrix

### Feature Access by Role

| Feature | Firm Admin | Partner | Practice Leader | Engagement Manager | Senior Auditor | Staff Auditor | Business Dev | Client Admin | Client User |
|---------|-----------|---------|----------------|-------------------|----------------|---------------|--------------|--------------|-------------|
| **User Management** |
| Create Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deactivate Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CRM** |
| View Clients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Clients | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit Clients | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Delete Clients | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Opportunities | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Engagements** |
| View All Engagements | ✅ | ✅ | ✅ | ✅ | 📋 | 📋 | ❌ | ❌ | ❌ |
| Create Engagements | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Assign Team | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete Engagements | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Fieldwork** |
| Create Workpapers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Review Workpapers | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Document Findings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload Evidence | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Send Info Requests | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Review Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deliver Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Time & Billing** |
| Enter Time | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Timesheets | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Invoices | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Analytics** |
| Firm Analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Revenue Analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| KPI Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Profitability | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Client Portal** |
| View Own Engagements | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Own Documents | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Own Invoices | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Respond to Requests | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

**Legend**:
- ✅ Full Access
- 📋 Only Assigned Items
- ❌ No Access

---

## Data Flow Security Verification

### Critical Data Paths

#### Path 1: Client Data → Client Portal
```
1. Client created in CRM (firm_id = F1)
   ├─> RLS: Only F1 members can see
   └─> client.id = C1

2. Engagement created (client_id = C1, firm_id = F1)
   ├─> RLS: Only F1 members OR assigned users can see
   └─> audit.id = E1

3. Client user created (client_id = C1)
   ├─> user_roles: (user_id = U1, role = client_user, client_id = C1)
   └─> RLS: User U1 can ONLY see data where client_id = C1

4. Client Portal query
   └─> Filter: WHERE client_id = C1
   └─> RLS: Automatically enforces client_id = C1

✅ SECURE: Client U1 cannot see data from other clients
```

#### Path 2: Time Entry → Invoice → Revenue Analytics
```
1. Staff auditor logs time (audit_id = E1, user_id = U2)
   ├─> RLS: User must be assigned to E1
   └─> time_entry.id = T1

2. Manager approves timesheet
   ├─> RLS: User must be manager+ role
   └─> time_entry.status = 'approved'

3. Invoice created from approved time
   ├─> invoice.client_id = C1
   └─> RLS: Only F1 members can see

4. Revenue analytics aggregates invoices
   ├─> Query: WHERE firm_id = F1
   └─> RLS: Automatically filters to F1 only

✅ SECURE: Firm F1 cannot see Firm F2's revenue
```

#### Path 3: Engagement Assignment → Data Access
```
1. Engagement created (audit_id = E1, firm_id = F1)
   └─> RLS: Only F1 members can see

2. User assigned to engagement
   ├─> engagement_assignments: (engagement_id = E1, user_id = U3, role = 'senior')
   └─> RLS: U3 can now see E1 even if from different office

3. User queries workpapers
   ├─> Query: SELECT * FROM audit_workpapers WHERE audit_id = E1
   └─> RLS: Allows if U3 assigned to E1 OR U3 is F1 partner

✅ SECURE: Assignment-based access works correctly
```

---

## Summary & Recommendations

### ✅ What's Working Well

1. **Database-Level Security**: Comprehensive RLS policies enforce multi-tenant isolation
2. **Multi-Tenant Architecture**: Clear firm-based separation with foreign key constraints
3. **Client Portal Isolation**: Separate authentication and data filtering for client users
4. **Platform Admin Separation**: Completely separate auth system for platform admins
5. **Data Relationships**: Properly defined foreign keys ensure referential integrity

### 🔴 Critical Actions Required

1. **Implement role-based route guards** for granular access control
2. **Add explicit client_id filters** in client portal queries (defense-in-depth)
3. **Create permission helper hooks** for conditional UI rendering
4. **Add audit logging** for sensitive operations

### 🟡 Medium Priority Improvements

5. **Implement rate limiting** on analytics endpoints
6. **Add data retention/archival policies**
7. **Create session management** with timeout and concurrent session limits

### 🟢 Future Enhancements

8. **Add MFA** for sensitive roles
9. **Implement IP whitelisting** for platform admin access
10. **Add anomaly detection** for unusual access patterns

---

## Conclusion

**Current Status**: The platform has a **solid security foundation** with comprehensive database-level Row-Level Security policies and multi-tenant isolation. However, **application-level role checks and permission guards are missing**, creating UX issues and potential information disclosure risks.

**Risk Level**: **MEDIUM** - Database security prevents actual data breaches, but lack of application-level guards could expose UI patterns and error messages.

**Next Steps**: Prioritize implementing role-based route guards and permission hooks to complete the security architecture.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-23
**Status**: Ready for Review
