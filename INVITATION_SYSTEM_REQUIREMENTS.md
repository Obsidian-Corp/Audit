# Multi-Tenant Invitation System Requirements

## Overview
Enterprise audit platform with strict multi-tenancy requiring three distinct onboarding flows.

---

## 1. Firm Administrator Signup ✅ COMPLETED

**Status:** Implemented
**Route:** `/auth/signup`
**Access:** Public

### Features:
- ✅ 3-step enterprise onboarding wizard
- ✅ Creates new firm account
- ✅ Assigns firm_administrator role
- ✅ Full platform access
- ✅ Secure onboarding function with 4 security checks

---

## 2. Employee Invitation System 🔴 REQUIRED

**Status:** Not implemented
**Route:** `/auth/accept-invite/:token` (employee)
**Access:** Invitation link only

### User Flow:
1. **Firm admin** goes to User Management → "Invite Team Member"
2. Enters: Email, Role (partner, senior_auditor, etc.), Department (optional)
3. System creates invitation record with secure token
4. Email sent to employee with invitation link
5. **Employee** clicks link → Simple signup page:
   - Name (optional if pre-filled)
   - Password
   - Accept terms
6. Account created → Joins firm with assigned role
7. Redirected to dashboard

### Database Requirements:

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_role CHECK (role != 'client_user' AND role != 'client_administrator')
);

CREATE INDEX idx_invitations_token ON user_invitations(token);
CREATE INDEX idx_invitations_email ON user_invitations(email);
```

### UI Components Needed:
- `InviteUserDialog.tsx` - Modal for admin to send invitation
- `AcceptInvitation.tsx` - Page for employee to accept invitation
- `UserManagementTable.tsx` - Shows pending/accepted invitations

### Security:
- Token expires after 7 days
- One-time use only
- Email must match invitation email
- Role assigned upon acceptance (no self-selection)
- Cannot invite to client roles (those use separate system)

---

## 3. Client Portal Invitation System 🔴 REQUIRED

**Status:** Partially implemented (portal exists, invitation missing)
**Route:** `/client-portal/accept-invite/:token`
**Access:** Invitation link only

### User Flow:
1. **Firm admin** creates/views engagement
2. Clicks "Invite Client Contact"
3. Enters: Name, Email, Company, Role (client_administrator or client_user)
4. System creates client invitation with token
5. Email sent with client portal invitation link
6. **Client** clicks link → Client portal signup:
   - Minimal info (name, password if not pre-filled)
   - Company name (if creating new client org)
   - Accept terms
7. Account created → Access to client portal only
8. Can view: assigned engagements, documents, requests, invoices

### Database Requirements:

```sql
CREATE TABLE client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) NOT NULL, -- The firm inviting the client
  client_id UUID REFERENCES clients(id), -- If invitation is for existing client
  engagement_id UUID REFERENCES engagements(id), -- Optional: specific engagement
  email TEXT NOT NULL,
  role app_role NOT NULL, -- client_administrator or client_user
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_client_role CHECK (role IN ('client_administrator', 'client_user'))
);

CREATE INDEX idx_client_invitations_token ON client_invitations(token);
CREATE INDEX idx_client_invitations_email ON client_invitations(email);
```

### Important Considerations:
- Client accounts are tied to CLIENT org (not FIRM)
- Clients table stores client companies
- Clients can have engagements with MULTIPLE firms
- Client portal shows engagements from ALL firms they work with
- Access can be revoked when engagement ends
- Separate authentication from firm users

### UI Components Needed:
- `InviteClientDialog.tsx` - Modal for firm admin to invite client
- `ClientAcceptInvitation.tsx` - Client portal signup page
- `EngagementClientManagement.tsx` - Manage client access per engagement

---

## 4. Access Control & Security

### RLS Policies Required:

```sql
-- Firm employees can only see their firm's data
CREATE POLICY "firm_isolation" ON profiles
FOR ALL TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- Clients can only see their own client organization's data
CREATE POLICY "client_isolation" ON client_data
FOR ALL TO authenticated
USING (
  client_id IN (
    SELECT client_id FROM profiles WHERE id = auth.uid()
  )
);

-- Firm users cannot access client portal
-- Client users cannot access main platform
-- Enforced at application routing level + RLS
```

### Route Protection:
- `/dashboard`, `/audit-overview`, etc. → Firm users only
- `/client-portal/*` → Client users only
- Platform admins (`/platform-admin`) → Separate auth system

---

## 5. Email Templates Required

### Employee Invitation Email:
```
Subject: You've been invited to join [Firm Name] on Obsidian

Hi [Name],

[Inviter Name] has invited you to join [Firm Name]'s team on the Obsidian Audit Platform.

Role: [Role]
Department: [Department]

Accept Invitation: [Link]

This invitation expires in 7 days.
```

### Client Invitation Email:
```
Subject: [Firm Name] has invited you to their Client Portal

Hi [Name],

[Firm Name] has invited you to access their secure client portal for [Engagement/Project Name].

Through the portal, you can:
- View engagement progress
- Upload and download documents
- Respond to information requests
- Track invoices

Access Client Portal: [Link]

This invitation expires in 14 days.
```

---

## 6. Implementation Priority

### Phase 1 (Critical):
1. ✅ Firm administrator signup (DONE)
2. 🔴 Employee invitation system
   - Database tables
   - Invitation sending
   - Acceptance flow

### Phase 2 (High Priority):
3. 🔴 Client portal invitation
   - Database tables
   - Invitation from engagement context
   - Client portal signup flow

### Phase 3 (Enhancement):
4. Invitation management UI
5. Resend/revoke invitations
6. Bulk invitations
7. Custom invitation messages
8. Audit trail for invitations

---

## 7. Testing Checklist

### Security Tests:
- [ ] Cannot use expired token
- [ ] Cannot reuse accepted token
- [ ] Cannot change assigned role during acceptance
- [ ] Cannot accept invitation for different email
- [ ] Firm employees cannot access client portal
- [ ] Clients cannot access main platform
- [ ] Users cannot join multiple firms
- [ ] Clients can work with multiple firms (separate client orgs)

### User Experience Tests:
- [ ] Clear error messages for invalid tokens
- [ ] Smooth onboarding flow (< 2 minutes)
- [ ] Proper email notifications
- [ ] Mobile-responsive signup pages
- [ ] Accessibility compliance

---

## References

See also:
- `TWO_PROJECT_SETUP_GUIDE.md` - Deprecated two-database approach
- `SINGLE_DATABASE_SETUP.md` - Current single-database architecture
- `ENTERPRISE_MULTI_TENANT_SUMMARY.md` - Multi-tenancy overview
- `src/pages/client-portal/*` - Existing client portal pages
- `src/pages/auth/Signup.tsx` - Firm admin signup implementation
