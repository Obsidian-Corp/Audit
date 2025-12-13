# Enterprise Onboarding Architecture

## Overview
This platform follows a strict invitation-only onboarding model appropriate for enterprise B2B software. There are NO public signup pages. All user access is granted through a controlled invitation system.

## Access Hierarchy

```
Platform Administrators (Obsidian Team)
    └─> Invite Firms
        └─> Firm Administrators
            ├─> Invite Employees
            └─> Invite Clients
```

## Current Implementation Status

### ✅ COMPLETED
1. **Employee Invitation System** (`user_invitations` table)
   - Firm admins can invite employees with specific roles
   - 7-day expiration on invitations
   - Acceptance flow at `/auth/accept-invite/:token`
   - Secure role assignment via `accept_employee_invitation()` function

2. **Client Invitation System** (`client_invitations` table)
   - Firm admins can invite clients for portal access
   - 14-day expiration on invitations
   - Acceptance flow at `/client-portal/accept-invite/:token`
   - Portal-only access (limited permissions)

3. **Security Measures**
   - Public firm signup route DISABLED (commented out in App.tsx)
   - Login page updated to remove "Sign up" link
   - Message directs users to contact firm admin for invitation

4. **Database Functions**
   - `complete_firm_administrator_signup()` - Secure firm creation when admin accepts invitation
   - `accept_employee_invitation()` - Employee invitation acceptance
   - `accept_client_invitation()` - Client invitation acceptance

### ⚠️ NEEDS IMPLEMENTATION
1. **Platform Admin Firm Invitation System**

   **What's Needed:**
   - New table: `firm_invitations`
     ```sql
     CREATE TABLE firm_invitations (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       invited_by UUID REFERENCES platform_admins(id),
       firm_name TEXT NOT NULL,
       admin_email TEXT NOT NULL,
       admin_first_name TEXT,
       admin_last_name TEXT,
       firm_type TEXT,
       token TEXT UNIQUE NOT NULL,
       expires_at TIMESTAMPTZ NOT NULL, -- 30 days for firms
       accepted_at TIMESTAMPTZ,
       created_at TIMESTAMPTZ DEFAULT now()
     );
     ```

   - **Platform Admin UI Component**: `InviteFirmDialog.tsx`
     - Form to enter firm details and admin contact
     - Generates secure invitation token
     - Sets 30-day expiration
     - Sends invitation email (or shows link for MVP)

   - **Firm Admin Acceptance Page**: `/auth/accept-firm-invite/:token`
     - Repurpose existing Signup.tsx (currently disabled)
     - Loads firm invitation details via `get_firm_invitation_details()` RPC
     - Shows firm info pre-filled
     - Admin creates password and completes onboarding
     - Calls `complete_firm_administrator_signup()` function

   - **Database Functions Needed**:
     ```sql
     -- Platform admin creates firm invitation
     create_firm_invitation(
       p_firm_name TEXT,
       p_admin_email TEXT,
       p_admin_first_name TEXT,
       p_admin_last_name TEXT,
       p_firm_type TEXT
     ) RETURNS jsonb

     -- Get invitation details for acceptance
     get_firm_invitation_details(
       p_token TEXT
     ) RETURNS jsonb
     ```

2. **Platform Admin Organization Management**
   - Add "Invite Firm" button to `OrganizationsList.tsx`
   - List of pending firm invitations in Platform Admin dashboard
   - Ability to resend/revoke firm invitations

## Onboarding Flows

### Flow 1: Platform Admin Invites New Firm
```
1. Platform Admin logs into platform-admin dashboard
2. Navigates to Organizations tab
3. Clicks "Invite New Firm" button
4. Fills out InviteFirmDialog:
   - Firm name
   - Firm administrator email
   - Administrator name
   - Firm type (solo, small, regional, national, international)
5. System generates secure token, creates firm_invitation record
6. System sends email with invitation link (or shows link)
7. Firm Admin receives email, clicks link to /auth/accept-firm-invite/:token
8. Firm Admin sees pre-filled firm info, creates account
9. System calls complete_firm_administrator_signup():
   - Creates firm record
   - Creates user account
   - Assigns firm_administrator role
   - Links profile to firm
10. Firm Admin redirected to /dashboard
```

### Flow 2: Firm Admin Invites Employee (✅ Already Implemented)
```
1. Firm Admin logs into dashboard
2. Navigates to Team/User Management
3. Clicks "Invite User"
4. Fills out invitation form with role and details
5. System generates invitation, sends email
6. Employee accepts at /auth/accept-invite/:token
7. Employee creates account, assigned to firm with role
```

### Flow 3: Firm Admin Invites Client (✅ Already Implemented)
```
1. Firm Admin manages client in CRM
2. Clicks "Invite to Portal"
3. System generates client invitation
4. Client accepts at /client-portal/accept-invite/:token
5. Client gets portal-only access to their engagements
```

## Security Principles

1. **No Public Signup**: All access is invitation-based
2. **Role-Based Access**: Every user has explicit roles assigned
3. **Data Isolation**: RLS policies enforce firm boundaries
4. **Audit Trail**: All invitations and role assignments logged
5. **Expiration**: All invitations expire after set period
6. **Secure Functions**: SECURITY DEFINER functions with validation checks

## Next Steps (Priority Order)

1. ✅ Disable public firm signup route - **COMPLETED**
2. ✅ Fix firm signup function to use correct schema - **COMPLETED**
3. ⚠️ Create `firm_invitations` table migration
4. ⚠️ Create `InviteFirmDialog` component
5. ⚠️ Add invitation functions (`create_firm_invitation`, `get_firm_invitation_details`)
6. ⚠️ Update Signup.tsx to work as firm invitation acceptance page
7. ⚠️ Add "Invite Firm" button to Platform Admin Organizations tab
8. ⚠️ Integrate email sending for all invitation types
9. ⚠️ Build invitation management UI (view/resend/revoke)

## Current State

- **Public firm signup**: DISABLED ✅
- **Employee invitations**: WORKING ✅
- **Client invitations**: WORKING ✅
- **Platform admin firm invitations**: NOT IMPLEMENTED ⚠️

The system is now properly secured for enterprise use, but Platform Admins need the ability to invite new firms. This is the final piece of the invitation architecture.
