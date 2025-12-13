# COMPREHENSIVE RLS POLICY FIX PLAN
## Audit Management Platform - Database Security & Access Control Strategy

**Created:** December 3, 2024
**Status:** Planning Phase
**Priority:** P0 CRITICAL

---

## EXECUTIVE SUMMARY

This plan addresses all RLS (Row-Level Security) policy issues in the audit management platform by aligning database security with business requirements, user roles, and audit workflow needs.

### Critical Understanding

**WHY RLS Policies Exist:**
1. **Multi-Tenant Isolation**: Prevent data leakage between different audit firms
2. **Role-Based Access Control**: Enforce who can view/edit data based on audit hierarchy
3. **Engagement-Level Security**: Restrict access to engagement data based on team assignments
4. **Compliance Requirements**: Meet PCAOB/GAAS standards for data confidentiality
5. **Client Confidentiality**: Ensure clients only see their own data

**Current Problem:**
- 15+ conflicting policies causing 403 errors
- Schema inconsistencies (firm_id vs organization_id)
- Incomplete tenant isolation (users without firm_id)
- Missing CRUD policies on critical tables
- RLS recursion causing infinite loops

---

## PART 1: USER ROLES & ACCESS REQUIREMENTS

### 1.1 Role Hierarchy (from app_role enum)

```
Audit Firm Hierarchy:
┌─────────────────────────────────┐
│ firm_administrator              │  Full firm access, user management
├─────────────────────────────────┤
│ partner                         │  Portfolio oversight, client management, approvals
├─────────────────────────────────┤
│ practice_leader                 │  Practice area management, strategic oversight
├─────────────────────────────────┤
│ business_development            │  Client acquisition, proposals, pipeline
├─────────────────────────────────┤
│ engagement_manager              │  Engagement execution, team coordination, approvals
├─────────────────────────────────┤
│ senior_auditor                  │  Review queue, workpaper review, mentoring
├─────────────────────────────────┤
│ staff_auditor                   │  Procedure execution, workpaper creation
└─────────────────────────────────┘

External Users:
┌─────────────────────────────────┐
│ client_administrator            │  Client-side admin, request management
├─────────────────────────────────┤
│ client_user                     │  Read-only client portal access
└─────────────────────────────────┘
```

### 1.2 Page Access Matrix

| Page/Feature | staff_auditor | senior_auditor | engagement_manager | partner | firm_admin | client_admin | client_user |
|--------------|---------------|----------------|-------------------|---------|------------|--------------|-------------|
| **Dashboard** |
| My Workspace | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **My Work** |
| My Procedures | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Time Tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Review Queue | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approvals | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Engagements** |
| Active Engagements | ✅ (assigned) | ✅ (assigned) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (theirs) | ✅ (theirs) |
| Templates | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Clients** |
| Client List | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Client Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Audit Tools** |
| Audit Universe | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Procedure Library | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Materiality Calc | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Resources** |
| Team Directory | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Scheduler | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Utilization | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Quality & Risk** |
| QC Dashboard | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Risk Register | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Analytics** |
| Firm Performance | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Revenue Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Audit Analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Profitability | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Finance** |
| Invoices | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Business Development** |
| Pipeline | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Proposals | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Administration** |
| Admin Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## PART 2: DATA ACCESS REQUIREMENTS BY TABLE

### 2.1 Core Tables & Business Logic

#### **clients** Table
**Purpose**: Store client/customer information for audit firms

**Access Requirements:**
- **INSERT**: Partners, Business Dev, Firm Admins (acquire new clients)
- **SELECT**: Partners, BD, Practice Leaders, Firm Admins (portfolio management)
- **UPDATE**: Partners, BD, Firm Admins (update client information)
- **DELETE**: Partners, Firm Admins (archive/remove clients)

**Business Logic:**
- Must have `firm_id` (tenant isolation)
- Partners need to see all clients in their firm
- Staff auditors DON'T need direct client access (access through engagements)
- Client users DON'T see client list (only their own engagement data)

**Why Previous Policies Failed:**
- Mixed `organization_id` and `firm_id` columns
- Some policies required specific roles, others checked firm membership
- No consistent approach to who can create clients

**Correct Policy:**
```sql
-- SELECT: Leadership roles can view all firm clients
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'practice_leader', 'business_development', 'firm_administrator')
    )
  );

-- INSERT: Leadership can create clients in their firm
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'business_development', 'firm_administrator')
    )
  );

-- UPDATE: Same roles can update
CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'business_development', 'firm_administrator')
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: Only partners and firm admins
CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'firm_administrator')
    )
  );
```

---

#### **engagements** (audits) Table
**Purpose**: Store audit engagement information

**Access Requirements:**
- **INSERT**: Managers, Partners, Practice Leaders, Firm Admins
- **SELECT**: All internal users (but filtered by assignment for staff)
- **UPDATE**: Managers+ on their engagements, Partners/Admins on all
- **DELETE**: Partners, Firm Admins only

**Business Logic:**
- Must have `firm_id` (tenant isolation)
- Staff/Seniors only see engagements they're assigned to
- Managers see engagements they manage
- Partners/Admins see all firm engagements
- Clients see only engagements where they're the client

**Correct Policy:**
```sql
-- SELECT: Role-based filtering
CREATE POLICY "engagements_select_policy" ON engagements
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      -- Partners/Admins see all
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('partner', 'firm_administrator', 'practice_leader')
      )
      -- Managers see engagements they manage
      OR engagement_manager_id = auth.uid()
      -- Team members see assigned engagements
      OR EXISTS (
        SELECT 1 FROM engagement_team
        WHERE engagement_id = engagements.id
        AND user_id = auth.uid()
      )
      -- Clients see their own engagements
      OR (
        client_id IN (
          SELECT id FROM clients
          WHERE client_administrator_id = auth.uid()
        )
      )
    )
  );

-- INSERT: Managers and above
CREATE POLICY "engagements_insert_policy" ON engagements
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
    )
  );

-- UPDATE: Manager of engagement or leadership
CREATE POLICY "engagements_update_policy" ON engagements
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      engagement_manager_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: Partners and firm admins only
CREATE POLICY "engagements_delete_policy" ON engagements
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('partner', 'firm_administrator')
    )
  );
```

---

#### **audit_procedures** Table
**Purpose**: Store individual audit procedure assignments and execution

**Access Requirements:**
- **INSERT**: Managers (assign procedures)
- **SELECT**: All team members can see assigned procedures
- **UPDATE**: Assigned user can update their procedures, Seniors+ can review
- **DELETE**: Managers and above

**Business Logic:**
- Procedures are assigned to specific users
- Assigned user must be able to complete and update status
- Reviewers (seniors+) need to read and comment
- Managers need full CRUD on procedures they manage

**Correct Policy:**
```sql
-- SELECT: See procedures assigned to you or your engagements
CREATE POLICY "procedures_select_policy" ON audit_procedures
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      -- Assigned to me
      assigned_to = auth.uid()
      -- Or I'm on the engagement team
      OR EXISTS (
        SELECT 1 FROM engagement_team et
        JOIN engagements e ON et.engagement_id = e.id
        WHERE et.user_id = auth.uid()
        AND e.id = audit_procedures.engagement_id
      )
      -- Or I'm a manager/partner
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  );

-- INSERT: Managers assign procedures
CREATE POLICY "procedures_insert_policy" ON audit_procedures
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('engagement_manager', 'partner', 'firm_administrator')
    )
  );

-- UPDATE: Assigned user or seniors+ can update
CREATE POLICY "procedures_update_policy" ON audit_procedures
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      assigned_to = auth.uid()  -- I'm assigned
      OR EXISTS (  -- Or I'm a reviewer
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('senior_auditor', 'engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: Managers and above
CREATE POLICY "procedures_delete_policy" ON audit_procedures
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('engagement_manager', 'partner', 'firm_administrator')
    )
  );
```

---

#### **profiles** Table
**Purpose**: Store user profile information

**Access Requirements:**
- **INSERT**: System only (via handle_new_user trigger)
- **SELECT**: All authenticated users can see firm members
- **UPDATE**: Users can update own profile, Admins can update any
- **DELETE**: System only (CASCADE from auth.users)

**Business Logic:**
- Every user MUST have a profile
- Profile MUST have firm_id (multi-tenant isolation)
- Users can see other users in their firm (for team assignment)
- Only admins can change roles/firm assignments

**Correct Policy:**
```sql
-- SELECT: See all firm members
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- INSERT: System only via trigger (no policy = no direct INSERT)

-- UPDATE: Own profile or admin
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()  -- Own profile
    OR EXISTS (  -- Or I'm an admin
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'firm_administrator'
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: System only (no policy)
```

---

#### **time_entries** Table
**Purpose**: Track billable/non-billable hours

**Access Requirements:**
- **INSERT**: Users create their own time entries
- **SELECT**: Users see own entries, Managers see team entries
- **UPDATE**: Users update own entries (if not approved), Managers approve
- **DELETE**: Users delete own entries (if not approved), Admins can delete any

**Business Logic:**
- Everyone needs to track time (P0 critical feature)
- Users own their time entries
- Managers need to approve time for billing
- Once approved, entries become locked

**Correct Policy:**
```sql
-- SELECT: Own entries or managed team entries
CREATE POLICY "time_entries_select_policy" ON time_entries
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      user_id = auth.uid()  -- Own entries
      OR EXISTS (  -- Or I'm a manager/partner
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  );

-- INSERT: Create own time entries
CREATE POLICY "time_entries_insert_policy" ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()  -- Must be your own entry
  );

-- UPDATE: Own entries or manager approval
CREATE POLICY "time_entries_update_policy" ON time_entries
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)  -- Own unapproved
      OR EXISTS (  -- Or manager approving
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: Own unapproved entries or admin
CREATE POLICY "time_entries_delete_policy" ON time_entries
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'firm_administrator'
      )
    )
  );
```

---

## PART 3: HELPER FUNCTIONS & TRIGGERS

### 3.1 user_firms() Function
**Purpose**: Return UUIDs of firms the current user belongs to

**Why It Exists**: Core multi-tenant isolation - all policies use this

**Current Problem**: Recursion issues, returns empty for users without firm_id

**Correct Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER  -- Bypass RLS to prevent recursion
SET search_path = public
STABLE  -- Query planner optimization
COST 10  -- Hint for query planner
AS $$
  -- Simple, direct query without subqueries
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;
```

### 3.2 user_has_role() Function
**Purpose**: Check if user has specific role

**Why It Exists**: Role-based access control in policies

**Current Problem**: May cause recursion, performance issues

**Correct Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.user_has_role(check_role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;
```

### 3.3 handle_new_user() Trigger
**Purpose**: Automatically create profile when user signs up

**Why It Exists**: Ensure every user has a profile with proper firm assignment

**Current Problem**: Creates profiles without firm_id

**Correct Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_invitation_token TEXT;
  v_default_role app_role;
BEGIN
  -- Extract invitation token from user metadata
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';

  -- If invited, get firm from invitation
  IF v_invitation_token IS NOT NULL THEN
    SELECT firm_id, default_role
    INTO v_firm_id, v_default_role
    FROM firm_invitations
    WHERE token = v_invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

    -- Update invitation status
    IF v_firm_id IS NOT NULL THEN
      UPDATE firm_invitations
      SET status = 'accepted',
          accepted_at = NOW(),
          accepted_by_user_id = NEW.id
      WHERE token = v_invitation_token;
    END IF;
  END IF;

  -- Create profile (firm_id may be NULL for self-signup, requires onboarding)
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    firm_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_firm_id,  -- NULL for self-signup
    NOW(),
    NOW()
  );

  -- Assign default role if invitation specified one
  IF v_default_role IS NOT NULL AND v_firm_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, firm_id, role)
    VALUES (NEW.id, v_firm_id, v_default_role);
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## PART 4: IMPLEMENTATION STRATEGY

### Phase 1: Schema Standardization (CRITICAL - Do First)
**Duration**: 30 minutes
**Risk**: Medium (renames columns, may break existing queries)

**Steps:**
1. Rename all `organization_id` columns to `firm_id`
2. Update all foreign key constraints
3. Drop any `organizations` table (rename to `firms` if needed)
4. Verify TypeScript types are updated

**SQL:**
```sql
-- See migration file: 20251203000002_phase1_schema_standardization.sql
```

### Phase 2: Clean Up All RLS Policies
**Duration**: 1 hour
**Risk**: High (removes all existing policies)

**Steps:**
1. Drop ALL existing RLS policies on all tables
2. Verify RLS is still enabled on tables
3. Create new policies following standard naming convention

**SQL:**
```sql
-- See migration file: 20251203000003_phase2_policy_cleanup.sql
```

### Phase 3: Fix Helper Functions & Triggers
**Duration**: 30 minutes
**Risk**: Medium (affects all subsequent operations)

**Steps:**
1. Recreate `user_firms()` with SECURITY DEFINER
2. Recreate `user_has_role()` with SECURITY DEFINER
3. Fix `handle_new_user()` trigger to assign firm_id
4. Backfill existing users without firm_id

**SQL:**
```sql
-- See migration file: 20251203000004_phase3_functions_triggers.sql
```

### Phase 4: Create Comprehensive RLS Policies
**Duration**: 2 hours
**Risk**: Low (adding new policies, thoroughly tested)

**Steps:**
1. Create policies for each table following access matrix
2. Test each policy with different roles
3. Validate no recursion issues

**SQL:**
```sql
-- See migration file: 20251203000005_phase4_comprehensive_policies.sql
```

### Phase 5: Data Validation & Testing
**Duration**: 1 hour
**Risk**: Low (read-only validation)

**Steps:**
1. Verify all users have firm_id
2. Verify all policies are created
3. Test CRUD operations as each role
4. Check for performance issues

**SQL:**
```sql
-- See validation queries in migration file
```

---

## PART 5: VALIDATION CHECKLIST

After applying all migrations, verify:

- [ ] All tables use `firm_id` (no `organization_id`)
- [ ] All users have `firm_id` in profiles table
- [ ] `user_firms()` returns non-empty results for all users
- [ ] All tables have exactly 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] No policy recursion (test by running queries)
- [ ] Staff auditors can create time entries
- [ ] Staff auditors CANNOT see other firm's data
- [ ] Partners can see all firm clients
- [ ] Managers can create engagements
- [ ] Clients can ONLY see their engagements
- [ ] New user signup creates profile with firm_id (if invited)
- [ ] All navigation pages work for each role

---

## PART 6: ROLLBACK PLAN

If issues occur during migration:

1. **Database Snapshot**: Take before starting (Supabase automatic backup)
2. **Rollback SQL**: Each migration has corresponding rollback
3. **Emergency Fix**: Temporarily disable RLS if critical production issue
   ```sql
   ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
   ```
4. **Contact Support**: Supabase support for database restoration

---

## CONCLUSION

This comprehensive plan fixes all RLS policy issues by:
1. Understanding WHY policies exist (business requirements)
2. Aligning policies with user roles and access needs
3. Fixing schema inconsistencies
4. Implementing best practices (SECURITY DEFINER, no recursion)
5. Thorough testing and validation

**Next Steps:**
1. Review this plan with stakeholders
2. Schedule maintenance window
3. Execute migrations in phase order
4. Validate with comprehensive testing
5. Monitor for issues post-deployment
