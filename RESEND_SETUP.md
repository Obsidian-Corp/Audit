# Resend Email Integration Setup

## Issue Summary
Firm invitations are being created successfully, but emails are not being sent because the Resend API is not fully configured.

## What's Been Fixed
1. ✅ Created `FirmInvitationsList` component to view all invitations
2. ✅ Added resend email functionality
3. ✅ Added copy link functionality
4. ✅ Created `get_email_template` RPC function (migration: `20251128000005_create_get_email_template_function.sql`)
5. ✅ Added `send-email` function to config.toml

## What You Need to Do

### Step 1: Run Database Migrations
Run these two new SQL migrations in your **Supabase Dashboard > SQL Editor**:

**Migration 1: Email Template**
```sql
-- File: supabase/migrations/20251128000004_create_firm_invitation_email_template.sql
-- Copy the entire contents from this file and run it
```

**Migration 2: Get Email Template Function**
```sql
-- File: supabase/migrations/20251128000005_create_get_email_template_function.sql
CREATE OR REPLACE FUNCTION public.get_email_template(p_template_key TEXT)
RETURNS TABLE (
  template_key TEXT,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  variables JSONB,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.template_key,
    t.subject,
    t.html_body,
    t.text_body,
    t.variables,
    t.is_active
  FROM platform_admin.email_templates t
  WHERE t.template_key = p_template_key
    AND t.is_active = true;
END;
$$;
```

### Step 2: Get Resend API Key
1. Go to https://resend.com
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (it starts with `re_`)

### Step 3: Configure Resend in Supabase

#### Option A: Via Supabase Dashboard (Recommended for Production)
1. Go to your **Supabase Project Dashboard**
2. Navigate to **Project Settings > Edge Functions**
3. Scroll to **Secrets / Environment Variables**
4. Add these secrets:
   - `RESEND_API_KEY`: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)
   - `EMAIL_FROM`: Your verified sender email (e.g., `Obsidian <noreply@yourdomain.com>`)

#### Option B: Via .env for Local Testing
Add to your `.env` file:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="Obsidian <noreply@yourdomain.com>"
```

### Step 4: Deploy send-email Function
```bash
supabase functions deploy send-email
```

### Step 5: Verify Email Domain (Important!)
1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records they provide to your domain registrar
4. Wait for verification (usually takes a few minutes)
5. Update `EMAIL_FROM` to use your verified domain

**Note:** Without a verified domain, Resend will only send emails to the email address associated with your Resend account.

### Step 6: Test the Integration
1. Go to **Platform Admin > Organizations**
2. Click **Invite Firm**
3. Fill out the form
4. Click **Create Invitation**
5. You should see "Invitation Sent Successfully"
6. Check the recipient's inbox (and spam folder)

### Step 7: View and Manage Invitations
The **Firm Invitations** section now appears below the Organizations list with:
- ✅ View all sent invitations
- ✅ See invitation status (Pending, Accepted, Expired)
- ✅ Resend emails for pending invitations
- ✅ Copy invitation links manually

## Troubleshooting

### Email not arriving?
1. Check Supabase Edge Function logs:
   - Go to **Edge Functions > send-email > Logs**
   - Look for errors related to Resend API
2. Verify your domain in Resend
3. Check spam folder
4. Make sure RESEND_API_KEY is set correctly

### Function errors?
1. Check the browser console for errors
2. Verify all migrations have been applied
3. Ensure send-email function is deployed

### Still not working?
1. Use the **Copy Link** button in the Firm Invitations list
2. Manually send the link to the firm administrator
3. The invitation will still work, just delivered manually

## Current Behavior Without Resend Configured
- ✅ Invitations are created in the database
- ✅ Invitation links are generated
- ✅ Success message is shown
- ❌ No actual email is sent (simulated only)
- ℹ️ You can still copy and send links manually
