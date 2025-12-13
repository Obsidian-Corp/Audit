# RLS POLICY BALANCED DESIGN
## Audit Management Platform - Practical Row-Level Security Strategy

**Created:** December 3, 2024
**Status:** Design Complete - Ready for Implementation
**Philosophy:** Enable work first, restrict only where necessary

---

## EXECUTIVE SUMMARY

### The Problem with Current Approach

The platform has oscillated between two extremes:
1. **Too restrictive**: Complex role-based policies causing 403 errors, blocking legitimate work
2. **Too permissive**: "Relax all policies" approach that eliminates role-based access control entirely

**Neither approach reflects how audit firms actually operate.**

### The Balanced Solution

This design implements **practical, workflow-based RLS policies** that:

- **Prioritize firm isolation** (CRITICAL): Firm A never sees Firm B's data
- **Enable daily work** (ESSENTIAL): Staff can create workpapers, track time, execute procedures
- **Respect hierarchy** (IMPORTANT): Partners approve, managers oversee, staff execute
- **Support collaboration** (REQUIRED): Team members work together on engagements
- **Audit everything** (COMPLIANCE): Log all actions, rely on audit trails over restrictions

### Key Principles

1. **Default to enabling**: If a role needs it for their job, give access
2. **Firm isolation is sacred**: Multi-tenancy must be bulletproof
3. **Engagement-based access**: Most restrictions are "are you on this engagement?" not "what's your role?"
4. **Role restrictions for sensitive ops**: User management, client deletion, financial approvals
5. **Audit trail over prevention**: Let people work, log everything, review regularly

### Implementation Approach

**Three-tier access model:**

- **Tier 1 - Open Tables**: All firm members have full CRUD (time_entries, audit_procedures, workpapers)
- **Tier 2 - Restricted Write**: All can read, limited roles can create/modify (clients, engagements)
- **Tier 3 - Admin Only**: Highly restricted access (user_roles, profiles, firm settings)

---

## ROLE ANALYSIS & ACCESS MATRIX

### Role Hierarchy & Actual Responsibilities

Based on `AppSidebar.tsx` and `audit-platform-ux-strategy.md`:

```
┌─────────────────────────────────────────────────────────────────┐
│ ROLE HIERARCHY                                                  │
├─────────────────────────────────────────────────────────────────┤
│ firm_administrator    │ IT/system admin, user management       │
│                       │ NOT audit work - administrative only   │
├───────────────────────┼────────────────────────────────────────┤
│ partner               │ Portfolio oversight, approvals         │
│                       │ Client relationships, final sign-off   │
│                       │ SEE everything, APPROVE selectively    │
├───────────────────────┼────────────────────────────────────────┤
│ practice_leader       │ Practice area management               │
│                       │ Quality control, strategic oversight   │
│                       │ Similar to partner for audit work      │
├───────────────────────┼────────────────────────────────────────┤
│ business_development  │ Sales, proposals, client acquisition   │
│                       │ CREATE clients, manage pipeline        │
│                       │ Limited audit execution access         │
├───────────────────────┼────────────────────────────────────────┤
│ engagement_manager    │ Day-to-day engagement execution        │
│                       │ Team coordination, budget management   │
│                       │ CREATE engagements, ASSIGN work        │
├───────────────────────┼────────────────────────────────────────┤
│ senior_auditor        │ REVIEW work, mentor staff              │
│                       │ Quality review, complex procedures     │
│                       │ UPDATE others' work (review capacity)  │
├───────────────────────┼────────────────────────────────────────┤
│ staff_auditor         │ EXECUTE procedures, CREATE workpapers  │
│                       │ The "do-ers" - need extensive access  │
│                       │ UPDATE own work, READ team's work      │
├───────────────────────┼────────────────────────────────────────┤
│ client_administrator  │ External client admin                  │
│                       │ View engagement status, upload docs    │
├───────────────────────┼────────────────────────────────────────┤
│ client_user           │ External read-only access              │
│                       │ View assigned engagement data only     │
└───────────────────────┴────────────────────────────────────────┘
```

### Access Requirements by Feature Area

#### Feature: Time Tracking
**Reality:** EVERYONE tracks time - it's mandatory, universal, critical to firm economics

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| staff_auditor | Own + Team (view) | Own | Own (if not approved) | Own (if not approved) |
| senior_auditor | Team | Own | Own + Team (approval) | Own (if not approved) |
| engagement_manager | All assigned | Own | All assigned (approve) | Admin only |
| partner | All firm | Own | All firm (override) | Admin only |
| firm_administrator | All firm | Own | All firm | All firm |

**Policy Design:** Open for creation, restricted for approval

#### Feature: Audit Procedures
**Reality:** Staff MUST be able to execute procedures assigned to them

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| staff_auditor | Assigned + engagement | Via program | Assigned to them | No |
| senior_auditor | All on engagements | Via program | Assigned + review | Via program |
| engagement_manager | All managed | Yes (assign) | All managed | Yes |
| partner | All firm | Yes | All firm | Yes |

**Policy Design:** Assignment-based, not role-based

#### Feature: Workpapers
**Reality:** Core deliverable - staff creates, seniors review, managers approve

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| staff_auditor | Engagement team | Yes (assigned procedures) | Own + assigned | Own (draft only) |
| senior_auditor | Engagement team | Yes | All team (review) | Team (review) |
| engagement_manager | All managed | Yes | All managed | All managed |
| partner | All firm | Yes | All firm | All firm |

**Policy Design:** Engagement-based with creator/reviewer logic

#### Feature: Clients
**Reality:** Partners/BD create clients, everyone views for reference

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| staff_auditor | All firm (read-only) | No | No | No |
| senior_auditor | All firm (read-only) | No | No | No |
| engagement_manager | All firm | No* | Assigned clients | No |
| partner | All firm | Yes | Yes | Yes |
| business_development | All firm | Yes | Yes | No |
| firm_administrator | All firm | Yes | Yes | Yes |

*Managers might create clients in some firms - make this configurable

**Policy Design:** Role-restricted writes, open reads

#### Feature: Engagements
**Reality:** Managers create, teams execute, partners oversee

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| staff_auditor | Assigned only | No | No | No |
| senior_auditor | Assigned only | No | No | No |
| engagement_manager | All firm | Yes | Managed | No |
| practice_leader | All firm | Yes | All firm | No |
| partner | All firm | Yes | All firm | Yes |
| firm_administrator | All firm | Yes | All firm | Yes |

**Policy Design:** Role + assignment-based hybrid

#### Feature: User Management (profiles, user_roles)
**Reality:** Only admins should modify users and role assignments

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| ALL ROLES | Own profile | No | Own profile | No |
| firm_administrator | All firm | Yes (invite) | All firm | Yes |

**Policy Design:** Locked down, admin-only writes

---

## TABLE-BY-TABLE POLICY DESIGN

### TIER 1: OPEN TABLES (Enable Work)

These tables should have **minimal restrictions** - all firm members can CREATE, READ, UPDATE within their firm.

#### 1. `time_entries` - Universal Time Tracking

**Access Philosophy:** Everyone must track time. Make it effortless.

**SELECT Policy:**
```sql
-- See own entries + managed team entries (for approvers)
CREATE POLICY "time_entries_select" ON time_entries
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      user_id = auth.uid()  -- Own entries
      OR EXISTS (  -- Or you're a manager/partner who can see team
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = time_entries.firm_id
        AND role IN ('engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
      )
    )
  );
```

**INSERT Policy:**
```sql
-- Create own time entries only
CREATE POLICY "time_entries_insert" ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND user_id = auth.uid()  -- Must be your own entry
  );
```

**UPDATE Policy:**
```sql
-- Update own unapproved entries OR approve as manager
CREATE POLICY "time_entries_update" ON time_entries
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      -- Own unapproved entries
      (user_id = auth.uid() AND (approved_at IS NULL OR approved_at > NOW()))
      -- Or manager approving
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = time_entries.firm_id
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Delete own unapproved entries OR admin override
CREATE POLICY "time_entries_delete" ON time_entries
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = time_entries.firm_id
        AND role = 'firm_administrator'
      )
    )
  );
```

**Why This Works:**
- Staff can enter time immediately (no friction)
- Managers can approve team time
- Approved time is locked (audit trail)
- Admins have override capability

---

#### 2. `audit_procedures` - Procedure Execution

**Access Philosophy:** If assigned to you OR on the engagement team, you can work on it.

**SELECT Policy:**
```sql
-- See procedures on your engagements
CREATE POLICY "audit_procedures_select" ON audit_procedures
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      -- Assigned to you
      assigned_to = auth.uid()
      -- Or on engagement team (team_members JSONB contains your ID)
      OR engagement_id IN (
        SELECT id FROM engagements
        WHERE firm_id IN (SELECT user_firms())
        AND (
          -- You're in team_members array
          team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
          -- Or you're the engagement manager
          OR created_by = auth.uid()
        )
      )
      -- Or you're manager/partner (see all)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_procedures.firm_id
        AND role IN ('engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
      )
    )
  );
```

**INSERT Policy:**
```sql
-- Managers can assign procedures
CREATE POLICY "audit_procedures_insert" ON audit_procedures
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = audit_procedures.firm_id
      AND role IN ('engagement_manager', 'senior_auditor', 'partner', 'firm_administrator')
    )
  );
```

**UPDATE Policy:**
```sql
-- Update if assigned to you OR you're a reviewer
CREATE POLICY "audit_procedures_update" ON audit_procedures
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      assigned_to = auth.uid()  -- Assigned user
      OR EXISTS (  -- Or reviewer/manager
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_procedures.firm_id
        AND role IN ('senior_auditor', 'engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Only managers can delete procedures
CREATE POLICY "audit_procedures_delete" ON audit_procedures
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = audit_procedures.firm_id
      AND role IN ('engagement_manager', 'partner', 'firm_administrator')
    )
  );
```

---

#### 3. `audit_workpapers` - Core Audit Documentation

**Access Philosophy:** Engagement team collaboration - all team members work together.

**SELECT Policy:**
```sql
-- See workpapers on your engagements
CREATE POLICY "audit_workpapers_select" ON audit_workpapers
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      -- Created by you
      created_by = auth.uid()
      -- Or on the engagement
      OR engagement_id IN (
        SELECT id FROM engagements
        WHERE firm_id IN (SELECT user_firms())
        AND (
          team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
          OR created_by = auth.uid()
        )
      )
      -- Or manager/partner
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_workpapers.firm_id
        AND role IN ('engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
      )
    )
  );
```

**INSERT Policy:**
```sql
-- All engagement team members can create workpapers
CREATE POLICY "audit_workpapers_insert" ON audit_workpapers
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND (
      -- On the engagement team
      engagement_id IN (
        SELECT id FROM engagements
        WHERE firm_id IN (SELECT user_firms())
        AND team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
      )
      -- Or manager/partner
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_workpapers.firm_id
        AND role IN ('engagement_manager', 'senior_auditor', 'partner', 'firm_administrator')
      )
    )
  );
```

**UPDATE Policy:**
```sql
-- Update own workpapers OR review others' as senior+
CREATE POLICY "audit_workpapers_update" ON audit_workpapers
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      -- Own workpapers (if not locked)
      (created_by = auth.uid() AND (status NOT IN ('approved', 'archived')))
      -- Or reviewer
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_workpapers.firm_id
        AND role IN ('senior_auditor', 'engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Delete own draft workpapers OR manager override
CREATE POLICY "audit_workpapers_delete" ON audit_workpapers
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      (created_by = auth.uid() AND status = 'draft')
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_workpapers.firm_id
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  );
```

---

#### 4. `audit_findings` - Issues & Observations

**Access Philosophy:** Anyone can document findings, seniors review, managers approve.

**SELECT Policy:**
```sql
-- See findings on your engagements
CREATE POLICY "audit_findings_select" ON audit_findings
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      -- On engagement team
      engagement_id IN (
        SELECT id FROM engagements
        WHERE firm_id IN (SELECT user_firms())
        AND team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
      )
      -- Or manager/partner
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_findings.firm_id
        AND role IN ('engagement_manager', 'senior_auditor', 'partner', 'firm_administrator')
      )
    )
  );
```

**INSERT Policy:**
```sql
-- All team members can create findings
CREATE POLICY "audit_findings_insert" ON audit_findings
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND engagement_id IN (
      SELECT id FROM engagements
      WHERE firm_id IN (SELECT user_firms())
      AND team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
    )
  );
```

**UPDATE Policy:**
```sql
-- Seniors+ can update findings for review/approval
CREATE POLICY "audit_findings_update" ON audit_findings
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      created_by = auth.uid()  -- Own findings
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = audit_findings.firm_id
        AND role IN ('senior_auditor', 'engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Managers can delete findings
CREATE POLICY "audit_findings_delete" ON audit_findings
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = audit_findings.firm_id
      AND role IN ('engagement_manager', 'partner', 'firm_administrator')
    )
  );
```

---

### TIER 2: RESTRICTED WRITE TABLES (Strategic Assets)

These tables need **role-based write restrictions** but should be readable by all firm members.

#### 5. `clients` - Client Master Data

**Access Philosophy:** Everyone reads, leaders create/modify, partners delete.

**SELECT Policy:**
```sql
-- All firm members can view clients
CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));
```

**INSERT Policy:**
```sql
-- Partners, BD, and admins can create clients
CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = clients.firm_id
      AND role IN ('partner', 'business_development', 'firm_administrator')
    )
  );
```

**UPDATE Policy:**
```sql
-- Partners, BD, managers, and admins can update clients
CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = clients.firm_id
      AND role IN ('partner', 'business_development', 'engagement_manager', 'firm_administrator')
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Only partners and admins can delete clients
CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = clients.firm_id
      AND role IN ('partner', 'firm_administrator')
    )
  );
```

---

#### 6. `engagements` - Audit Engagements

**Access Philosophy:** Staff see assigned, managers see all, partners control.

**SELECT Policy:**
```sql
-- Role-based filtering for engagements
CREATE POLICY "engagements_select" ON engagements
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      -- Partners/admins/practice leaders see all
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = engagements.firm_id
        AND role IN ('partner', 'firm_administrator', 'practice_leader')
      )
      -- Engagement managers see all (for resource planning)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = engagements.firm_id
        AND role = 'engagement_manager'
      )
      -- Team members see assigned engagements
      OR team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
      OR created_by = auth.uid()
    )
  );
```

**INSERT Policy:**
```sql
-- Managers and above can create engagements
CREATE POLICY "engagements_insert" ON engagements
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = engagements.firm_id
      AND role IN ('engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
    )
  );
```

**UPDATE Policy:**
```sql
-- Managers of engagement OR partners can update
CREATE POLICY "engagements_update" ON engagements
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      created_by = auth.uid()  -- Creator (engagement manager)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND firm_id = engagements.firm_id
        AND role IN ('partner', 'practice_leader', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Only partners and admins can delete engagements
CREATE POLICY "engagements_delete" ON engagements
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = engagements.firm_id
      AND role IN ('partner', 'firm_administrator')
    )
  );
```

---

#### 7. `audit_programs` - Audit Program Templates

**Access Philosophy:** Managers create programs, all team members reference.

**SELECT Policy:**
```sql
-- All firm members can view programs
CREATE POLICY "audit_programs_select" ON audit_programs
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));
```

**INSERT Policy:**
```sql
-- Managers and above can create programs
CREATE POLICY "audit_programs_insert" ON audit_programs
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = audit_programs.firm_id
      AND role IN ('engagement_manager', 'senior_auditor', 'partner', 'firm_administrator')
    )
  );
```

**UPDATE Policy:**
```sql
-- Managers and above can update programs
CREATE POLICY "audit_programs_update" ON audit_programs
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = audit_programs.firm_id
      AND role IN ('engagement_manager', 'senior_auditor', 'partner', 'firm_administrator')
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Managers and above can delete programs
CREATE POLICY "audit_programs_delete" ON audit_programs
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = audit_programs.firm_id
      AND role IN ('engagement_manager', 'partner', 'firm_administrator')
    )
  );
```

---

#### 8. `risk_assessments` - Risk Assessment Data

**Access Philosophy:** Seniors create, managers approve, partners sign off.

**SELECT Policy:**
```sql
-- All firm members can view risk assessments
CREATE POLICY "risk_assessments_select" ON risk_assessments
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));
```

**INSERT Policy:**
```sql
-- Seniors and above can create risk assessments
CREATE POLICY "risk_assessments_insert" ON risk_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = risk_assessments.firm_id
      AND role IN ('senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
    )
  );
```

**UPDATE Policy:**
```sql
-- Seniors and above can update risk assessments
CREATE POLICY "risk_assessments_update" ON risk_assessments
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = risk_assessments.firm_id
      AND role IN ('senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator')
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Managers and partners can delete risk assessments
CREATE POLICY "risk_assessments_delete" ON risk_assessments
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = risk_assessments.firm_id
      AND role IN ('engagement_manager', 'partner', 'firm_administrator')
    )
  );
```

---

### TIER 3: ADMIN-ONLY TABLES (System Management)

These tables should be **highly restricted** - only firm administrators can modify.

#### 9. `profiles` - User Profiles

**Access Philosophy:** Everyone sees firm colleagues, only you edit your profile, admins manage all.

**SELECT Policy:**
```sql
-- All firm members can view other firm members
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));
```

**INSERT Policy:**
```sql
-- NO INSERT policy - profiles created by trigger only
-- This prevents direct user creation
```

**UPDATE Policy:**
```sql
-- Update own profile OR admin updates any
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()  -- Own profile
    OR EXISTS (  -- Or admin
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = profiles.firm_id
      AND role = 'firm_administrator'
    )
  )
  WITH CHECK (
    firm_id IN (SELECT user_firms())  -- Cannot change firm
  );
```

**DELETE Policy:**
```sql
-- NO DELETE policy - profiles deleted by CASCADE only
-- This prevents accidental user deletion
```

---

#### 10. `user_roles` - Role Assignments

**Access Philosophy:** Read-only for all, write-only for admins.

**SELECT Policy:**
```sql
-- All firm members can see role assignments (transparency)
CREATE POLICY "user_roles_select" ON user_roles
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));
```

**INSERT Policy:**
```sql
-- Only admins can assign roles
CREATE POLICY "user_roles_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.firm_id = user_roles.firm_id
      AND ur.role = 'firm_administrator'
    )
  );
```

**UPDATE Policy:**
```sql
-- Only admins can update roles (e.g., expiration dates)
CREATE POLICY "user_roles_update" ON user_roles
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.firm_id = user_roles.firm_id
      AND ur.role = 'firm_administrator'
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- Only admins can revoke roles
CREATE POLICY "user_roles_delete" ON user_roles
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.firm_id = user_roles.firm_id
      AND ur.role = 'firm_administrator'
    )
  );
```

---

#### 11. `firms` - Firm Master Data

**Access Philosophy:** Read own firm, admin edits.

**SELECT Policy:**
```sql
-- Users can view their own firm
CREATE POLICY "firms_select" ON firms
  FOR SELECT TO authenticated
  USING (id IN (SELECT user_firms()));
```

**INSERT Policy:**
```sql
-- NO INSERT - firms created via signup/onboarding only
```

**UPDATE Policy:**
```sql
-- Only firm administrators can update firm settings
CREATE POLICY "firms_update" ON firms
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND firm_id = firms.id
      AND role = 'firm_administrator'
    )
  )
  WITH CHECK (id IN (SELECT user_firms()));
```

**DELETE Policy:**
```sql
-- NO DELETE - firms are never deleted, only archived
```

---

### SUPPORTING TABLES (Contextual Policies)

#### 12. `audit_reports` - Final Deliverables

**SELECT:** Engagement team + client users
**INSERT:** Managers and above
**UPDATE:** Managers for drafts, partners for final
**DELETE:** Partners only

```sql
CREATE POLICY "audit_reports_select" ON audit_reports
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      engagement_id IN (
        SELECT id FROM engagements
        WHERE team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
      )
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND firm_id = audit_reports.firm_id
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  );
```

#### 13. `invoices` - Billing Documents

**SELECT:** Partners, finance, admins
**INSERT:** Partners, finance, admins
**UPDATE:** Partners (approval), finance (edits), admins
**DELETE:** Admins only

```sql
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND firm_id = invoices.firm_id
      AND role IN ('partner', 'firm_administrator')  -- Add finance role if needed
    )
  );
```

---

## ENGAGEMENT-BASED ACCESS PATTERNS

### The Engagement Team Concept

Most audit work happens within **engagement context**. Instead of complex role checks, we use:

```sql
-- Helper function: Is user on engagement team?
CREATE OR REPLACE FUNCTION is_engagement_team_member(engagement_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM engagements
    WHERE id = engagement_uuid
    AND firm_id IN (SELECT user_firms())
    AND (
      team_members @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()))
      OR created_by = auth.uid()
    )
  );
$$;
```

### Engagement Team Pattern

Use this pattern for engagement-specific tables:

```sql
-- Example: Information Requests
CREATE POLICY "information_requests_select" ON information_requests
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND is_engagement_team_member(engagement_id)
  );
```

### Engagement Manager Pattern

For operations requiring engagement oversight:

```sql
-- Helper function: Is user the engagement manager?
CREATE OR REPLACE FUNCTION is_engagement_manager(engagement_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM engagements
    WHERE id = engagement_uuid
    AND firm_id IN (SELECT user_firms())
    AND created_by = auth.uid()
  );
$$;
```

---

## HELPER FUNCTIONS & UTILITIES

### 1. `user_firms()` - Core Multi-Tenancy Function

**Critical:** This function MUST use `SECURITY DEFINER` to prevent RLS recursion.

```sql
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER  -- Bypass RLS to prevent recursion
SET search_path = public
STABLE
COST 10  -- Query planner hint
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.user_firms() IS
  'Returns firm IDs for current user. Used in RLS policies for multi-tenant isolation.';
```

### 2. `user_has_role()` - Role Checking Helper

```sql
CREATE OR REPLACE FUNCTION public.user_has_role(check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

COMMENT ON FUNCTION public.user_has_role(app_role) IS
  'Checks if current user has specified role in their firm.';
```

### 3. `user_has_any_role()` - Multiple Role Check

```sql
CREATE OR REPLACE FUNCTION public.user_has_any_role(check_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(check_roles)
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

COMMENT ON FUNCTION public.user_has_any_role(app_role[]) IS
  'Checks if current user has any of the specified roles.';
```

### 4. `handle_new_user()` - User Creation Trigger

**Critical:** Must assign firm_id from invitation or require onboarding.

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

  -- If invited, get firm and role from invitation
  IF v_invitation_token IS NOT NULL THEN
    SELECT firm_id, default_role
    INTO v_firm_id, v_default_role
    FROM firm_invitations
    WHERE token = v_invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

    -- Mark invitation as accepted
    IF v_firm_id IS NOT NULL THEN
      UPDATE firm_invitations
      SET status = 'accepted',
          accepted_at = NOW(),
          accepted_by_user_id = NEW.id
      WHERE token = v_invitation_token;
    END IF;
  END IF;

  -- Create profile
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
    v_firm_id,  -- NULL for non-invited (requires onboarding)
    NOW(),
    NOW()
  );

  -- Assign default role if from invitation
  IF v_default_role IS NOT NULL AND v_firm_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, firm_id, role, assigned_at)
    VALUES (NEW.id, v_firm_id, v_default_role, NOW());
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## IMPLEMENTATION STRATEGY

### Phase 1: Foundation (Week 1) - CRITICAL PATH

**Goal:** Establish firm isolation and core helper functions

**Tasks:**
1. Verify all tables have `firm_id` column (not `organization_id`)
2. Create/update `user_firms()` function with SECURITY DEFINER
3. Create helper functions (`user_has_role`, `is_engagement_team_member`)
4. Update `handle_new_user()` trigger
5. Backfill any NULL `firm_id` values

**Migration File:** `20251203100001_phase1_foundation.sql`

**Validation:**
```sql
-- All users have firm_id
SELECT COUNT(*) FROM profiles WHERE firm_id IS NULL;
-- Should return 0

-- All users have at least one role
SELECT COUNT(*) FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL;
-- Should return 0

-- user_firms() returns results for all users
SELECT COUNT(*) FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_firms() uf
  WHERE uf = profiles.firm_id
);
-- Should return 0
```

---

### Phase 2: Core Tables (Week 1-2) - HIGH PRIORITY

**Goal:** Enable daily work - time tracking, procedures, workpapers

**Tables to Fix (in order):**
1. `time_entries` - Universal time tracking
2. `audit_procedures` - Procedure execution
3. `audit_workpapers` - Documentation
4. `audit_findings` - Issue tracking

**Approach:**
```sql
-- For each table:
-- 1. Drop all existing policies
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

-- 2. Create new comprehensive policies
-- (Use templates from Tier 1 above)

-- 3. Validate immediately
-- Test with different roles
```

**Migration File:** `20251203100002_phase2_core_tables.sql`

**Validation:**
```sql
-- Staff can insert time entries
SET ROLE authenticated;
SET request.jwt.claims.sub = '<staff_user_id>';
INSERT INTO time_entries (user_id, firm_id, ...) VALUES (...);
-- Should succeed

-- Staff can insert procedures assigned to them
UPDATE audit_procedures SET status = 'in_progress'
WHERE id = '<assigned_procedure_id>';
-- Should succeed
```

---

### Phase 3: Strategic Tables (Week 2) - MEDIUM PRIORITY

**Goal:** Role-based restrictions for strategic operations

**Tables to Fix:**
1. `clients` - Client management
2. `engagements` - Engagement management
3. `audit_programs` - Program templates
4. `risk_assessments` - Risk data

**Approach:** Use Tier 2 templates with role checks

**Migration File:** `20251203100003_phase3_strategic_tables.sql`

**Validation:**
```sql
-- Partners can create clients
-- Staff CANNOT create clients
-- All can READ clients
```

---

### Phase 4: Admin Tables (Week 2) - LOW PRIORITY

**Goal:** Lock down administrative functions

**Tables to Fix:**
1. `profiles` - User management
2. `user_roles` - Role assignments
3. `firms` - Firm settings

**Approach:** Use Tier 3 templates - admin-only writes

**Migration File:** `20251203100004_phase4_admin_tables.sql`

---

### Phase 5: Remaining Tables (Week 3) - AS NEEDED

**Apply appropriate tier template to:**
- `audit_reports`
- `invoices`
- `opportunities` (CRM)
- `proposals`
- `confirmations`
- `information_requests`
- `audit_evidence`
- etc.

**Migration File:** `20251203100005_phase5_remaining_tables.sql`

---

## SPECIAL CONSIDERATIONS

### Client Portal Access

**External users (client_administrator, client_user) need special handling:**

```sql
-- Clients can only see their own engagements
CREATE POLICY "clients_see_own_engagements" ON engagements
  FOR SELECT TO authenticated
  USING (
    -- Internal firm members (covered by other policy)
    firm_id IN (SELECT user_firms())
    OR
    -- External client users
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = engagements.client_id
      -- Check if client_administrator_id matches or client_user has access
      AND (
        c.client_administrator_id = auth.uid()
        OR auth.uid() IN (SELECT jsonb_array_elements_text(c.client_users::jsonb))
      )
    )
  );
```

### Partner Override Pattern

**Partners should have override access for audit/compliance:**

```sql
-- Pattern for sensitive operations
AND (
  <normal_condition>
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND firm_id = table_name.firm_id
    AND role IN ('partner', 'firm_administrator')
  )
)
```

### Approval Workflow Pattern

**For tables with approval status:**

```sql
-- Example: Time entry approval
UPDATE time_entries
SET
  approved_at = NOW(),
  approved_by = auth.uid()
WHERE
  id = <entry_id>
  AND firm_id IN (SELECT user_firms())
  AND user_has_any_role(ARRAY['engagement_manager', 'partner', 'firm_administrator']::app_role[]);
```

---

## SQL MIGRATION TEMPLATE

### Complete Migration Structure

```sql
-- =============================================================================
-- COMPREHENSIVE RLS POLICY FIX
-- Phase: <phase_number>
-- Tables: <table_list>
-- Date: <date>
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: DROP EXISTING CONFLICTING POLICIES
-- =============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT DISTINCT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('<table1>', '<table2>', ...)  -- Tables to fix
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    RAISE NOTICE 'Dropped policy: %.%', pol.tablename, pol.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- STEP 2: CREATE HELPER FUNCTIONS (if needed)
-- =============================================================================

-- user_firms() function
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 10
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

-- user_has_any_role() function
CREATE OR REPLACE FUNCTION public.user_has_any_role(check_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(check_roles)
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- =============================================================================
-- STEP 3: CREATE NEW COMPREHENSIVE POLICIES
-- =============================================================================

-- TABLE: time_entries
-- -------------------------------------------------------

CREATE POLICY "time_entries_select" ON time_entries
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      user_id = auth.uid()
      OR user_has_any_role(ARRAY['engagement_manager', 'partner', 'practice_leader', 'firm_administrator']::app_role[])
    )
  );

CREATE POLICY "time_entries_insert" ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND user_id = auth.uid()
  );

CREATE POLICY "time_entries_update" ON time_entries
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR user_has_any_role(ARRAY['engagement_manager', 'partner', 'firm_administrator']::app_role[])
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));

CREATE POLICY "time_entries_delete" ON time_entries
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR user_has_any_role(ARRAY['firm_administrator']::app_role[])
    )
  );

-- Repeat for other tables...

-- =============================================================================
-- STEP 4: VALIDATE POLICIES
-- =============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
BEGIN
  FOR table_name IN
    SELECT DISTINCT tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('<table1>', '<table2>', ...)
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name AND schemaname = 'public';

    RAISE NOTICE 'Table % has % policies', table_name, policy_count;

    -- Expect 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
    -- Some tables may have fewer (e.g., no INSERT for profiles)
  END LOOP;
END $$;

-- =============================================================================
-- STEP 5: TEST POLICIES
-- =============================================================================

-- Test 1: Verify firm isolation
DO $$
DECLARE
  firm1_id UUID;
  firm2_id UUID;
BEGIN
  SELECT id INTO firm1_id FROM firms ORDER BY created_at LIMIT 1;
  SELECT id INTO firm2_id FROM firms ORDER BY created_at OFFSET 1 LIMIT 1;

  -- Users in firm1 should NOT see firm2 data
  -- (Add specific test queries here)

  RAISE NOTICE 'Firm isolation test: OK';
END $$;

-- Test 2: Verify role-based access
-- (Add specific test queries for different roles)

COMMIT;

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
-- Run this in a separate transaction if you need to undo:
--
-- BEGIN;
-- DROP POLICY IF EXISTS "time_entries_select" ON time_entries;
-- DROP POLICY IF EXISTS "time_entries_insert" ON time_entries;
-- DROP POLICY IF EXISTS "time_entries_update" ON time_entries;
-- DROP POLICY IF EXISTS "time_entries_delete" ON time_entries;
-- -- Repeat for other policies...
-- COMMIT;
```

---

## VALIDATION QUERIES

### Post-Migration Validation Checklist

```sql
-- =============================================================================
-- VALIDATION QUERY SUITE
-- Run after each phase to verify policies work correctly
-- =============================================================================

-- 1. CHECK: All tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
-- All should have rowsecurity = true

-- 2. CHECK: Policy count per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Most tables should have 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 3. CHECK: No conflicting policies on same table
SELECT
  tablename,
  cmd,
  COUNT(*) as policies_for_operation
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;
-- Should return 0 rows (no duplicate operation policies)

-- 4. CHECK: All users have firm_id
SELECT COUNT(*) as users_without_firm
FROM profiles
WHERE firm_id IS NULL;
-- Should return 0

-- 5. CHECK: All users have at least one role
SELECT
  p.id,
  p.email,
  p.firm_id
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL;
-- Should return 0 rows

-- 6. CHECK: user_firms() function works for all users
SELECT
  p.id,
  p.email,
  (SELECT COUNT(*) FROM user_firms() WHERE user_firms = p.firm_id) as firm_count
FROM profiles p;
-- All should have firm_count = 1

-- 7. CHECK: Firm isolation (no cross-firm data leakage)
-- Test by querying as different firm users
-- This requires actual user sessions, cannot be tested in pure SQL

-- 8. CHECK: Role-based access works
-- Example: Staff should NOT be able to create clients
-- (Requires session-based testing)

-- 9. CHECK: Performance - no slow policies
EXPLAIN ANALYZE
SELECT * FROM time_entries
WHERE firm_id IN (SELECT user_firms());
-- Should use index on firm_id, execution time < 50ms

-- 10. CHECK: No RLS recursion errors
-- Run queries on tables with policies as authenticated user
-- Should not trigger infinite loops

-- =============================================================================
-- FUNCTIONAL TESTS (require authenticated sessions)
-- =============================================================================

-- Test as staff_auditor:
-- ✅ Can insert own time entries
-- ✅ Can update own procedures
-- ✅ Can create workpapers on assigned engagements
-- ❌ CANNOT create clients
-- ❌ CANNOT create engagements
-- ❌ CANNOT assign roles

-- Test as engagement_manager:
-- ✅ Can create engagements
-- ✅ Can assign procedures
-- ✅ Can approve time entries
-- ✅ Can update team workpapers
-- ❌ CANNOT assign roles
-- ❌ CANNOT delete engagements (partner only)

-- Test as partner:
-- ✅ Can do everything internal
-- ✅ Can delete clients
-- ✅ Can delete engagements
-- ❌ CANNOT assign roles (admin only)

-- Test as firm_administrator:
-- ✅ Can do everything
-- ✅ Can assign/revoke roles
-- ✅ Can manage users

-- Test as client_user:
-- ✅ Can view assigned engagements
-- ✅ Can upload documents to information requests
-- ❌ CANNOT see other clients' data
-- ❌ CANNOT modify firm data
```

---

## APPENDIX A: Complete Table List

### Tables Requiring RLS Policies

**Tier 1 - Open Tables (Enable Work):**
- `time_entries`
- `audit_procedures`
- `audit_workpapers`
- `audit_findings`
- `audit_evidence`
- `information_requests`
- `confirmations`
- `workpaper_comments`
- `review_notes`

**Tier 2 - Restricted Write Tables (Strategic):**
- `clients`
- `engagements`
- `audit_programs`
- `risk_assessments`
- `audit_reports`
- `opportunities` (CRM)
- `proposals`
- `contracts`

**Tier 3 - Admin-Only Tables (System):**
- `profiles`
- `user_roles`
- `firms`
- `firm_invitations`
- `firm_settings`
- `audit_logs`

**Special Cases:**
- `engagement_team` - Junction table, use engagement-based logic
- `storage.objects` - File storage, use bucket policies
- `notifications` - User-specific, no firm restrictions needed
- `activity_log` - Audit trail, read-only for admins

---

## APPENDIX B: Migration Execution Plan

### Pre-Migration Checklist

- [ ] Backup database (Supabase automatic backup)
- [ ] Notify users of brief maintenance window (if needed)
- [ ] Review current policy count: `SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';`
- [ ] Document current issues (403 errors, blocked operations)
- [ ] Prepare rollback scripts

### Execution Steps

1. **Run Phase 1 migration** (Foundation)
   - Verify no errors
   - Run validation queries
   - Test user_firms() function

2. **Run Phase 2 migration** (Core Tables)
   - Test time entry creation as staff
   - Test procedure updates
   - Test workpaper creation

3. **Run Phase 3 migration** (Strategic Tables)
   - Test client creation as partner
   - Test client creation as staff (should fail)
   - Test engagement creation as manager

4. **Run Phase 4 migration** (Admin Tables)
   - Test role assignment as admin
   - Test role assignment as partner (should fail)

5. **Run Phase 5 migration** (Remaining Tables)
   - Test remaining features
   - Verify all navigation works

### Post-Migration Checklist

- [ ] All validation queries pass
- [ ] No 403 errors on core workflows
- [ ] Staff can create time entries
- [ ] Staff can update procedures
- [ ] Managers can create engagements
- [ ] Partners can delete clients
- [ ] Admins can assign roles
- [ ] Firm isolation verified (no cross-firm access)
- [ ] Performance acceptable (query times < 100ms)
- [ ] Monitor error logs for 24 hours

---

## APPENDIX C: Troubleshooting Guide

### Common Issues & Solutions

**Issue: "new row violates row-level security policy"**
- **Cause:** User doesn't have INSERT permission
- **Check:** `SELECT * FROM user_roles WHERE user_id = auth.uid();`
- **Fix:** Verify user has required role OR policy allows operation

**Issue: "infinite recursion detected in policy"**
- **Cause:** Policy function queries table with RLS
- **Check:** Look for SECURITY DEFINER on helper functions
- **Fix:** Add SECURITY DEFINER to `user_firms()` and similar functions

**Issue: "Users can't see any data"**
- **Cause:** `user_firms()` returns empty set
- **Check:** `SELECT * FROM profiles WHERE id = auth.uid();`
- **Fix:** Ensure user has `firm_id` populated

**Issue: "Staff can't create time entries"**
- **Cause:** Policy too restrictive
- **Check:** `SELECT * FROM pg_policies WHERE tablename = 'time_entries' AND cmd = 'INSERT';`
- **Fix:** Ensure INSERT policy only checks firm_id, not role

**Issue: "Performance degradation"**
- **Cause:** Policy does full table scan
- **Check:** `EXPLAIN ANALYZE SELECT * FROM table WHERE firm_id IN (SELECT user_firms());`
- **Fix:** Ensure index exists on firm_id column

---

## CONCLUSION

This balanced RLS policy design reflects **how audit firms actually work**:

1. **Firm isolation is absolute** - Multi-tenancy is never compromised
2. **Work is enabled by default** - Staff can create, update, and collaborate
3. **Restrictions are strategic** - Only sensitive operations require role checks
4. **Audit trails matter** - Log everything, review regularly, trust your team
5. **Engagement-based access** - Team collaboration over rigid hierarchies

### Success Metrics

After implementation, you should see:
- ✅ Zero 403 errors on daily workflows
- ✅ Time entry compliance > 95%
- ✅ Staff productivity increase (fewer blocked operations)
- ✅ Partner confidence in security (firm isolation verified)
- ✅ Audit compliance (all actions logged)

### Next Steps

1. Review this design with stakeholders
2. Run Phase 1 migration (foundation)
3. Test thoroughly with different roles
4. Roll out remaining phases
5. Monitor and adjust based on real usage

**This is a working platform, not a locked-down fortress. Enable your team to do great audit work.**

---

**Document Version:** 1.0
**Last Updated:** December 3, 2024
**Author:** AI System Architect
**Status:** Ready for Implementation
