# Single Database Setup Guide

## Architecture Overview

This audit platform uses **one Supabase project** with **schema separation** for security.

### Project Details
- **Project ID**: `qtsvdeauuawfewdzbflr`
- **URL**: `https://qtsvdeauuawfewdzbflr.supabase.co`

### Database Structure

```
┌─────────────────────────────────────────────────┐
│  Supabase Project: qtsvdeauuawfewdzbflr         │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ public schema                           │   │
│  │  - users, firms, engagements            │   │
│  │  - clients, audit_data, reports         │   │
│  │  - findings, time_tracking              │   │
│  │  - billing (stripe_customers, etc.)     │   │
│  │  - email_sent_log                       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ platform_admin schema (isolated)        │   │
│  │  - subscription_plans, stripe_config    │   │
│  │  - impersonation_sessions/actions       │   │
│  │  - email_templates, email_analytics     │   │
│  │  - performance monitoring tables        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Security: Row Level Security (RLS) policies   │
└─────────────────────────────────────────────────┘
```

---

## Environment Variables

```bash
# Supabase Database
# Single database with schema separation (public.* and platform_admin.*)
VITE_SUPABASE_PROJECT_ID="qtsvdeauuawfewdzbflr"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_URL="https://qtsvdeauuawfewdzbflr.supabase.co"
```

---

## Migration Structure

All migrations are in `supabase/migrations/`:

**Product Migrations (42 files):**
- Users, firms, engagements
- Clients, audit data, reports
- Findings, time tracking
- Comments, document storage

**Admin Migrations (4 files):**
- `20251125215838_create_billing_tables.sql`
- `20251125220423_create_impersonation_tables.sql`
- `20251126101446_create_email_templates.sql`
- `20251126101737_create_performance_monitoring.sql`

**Total: 46 migrations**

---

## Deployment Instructions

### 1. Login to Supabase

```bash
supabase login
```

### 2. Link to Project

```bash
cd /Users/abdulkarimsankareh/Downloads/build-it-happens-37494
supabase link --project-ref qtsvdeauuawfewdzbflr
```

### 3. Deploy All Migrations

```bash
supabase db push
```

This will deploy all 46 migrations to your database.

### 4. Verify Deployment

```bash
supabase db remote list
```

You should see tables in both `public` and `platform_admin` schemas.

---

## Security Model

### Schema-Level Separation

**public schema:**
- All user-facing product tables
- Accessible to organizations via RLS

**platform_admin schema:**
- Admin-only configuration and monitoring
- Requires `is_platform_admin()` check

### Row-Level Security (RLS)

**Organization Isolation:**
```sql
-- Example: Organizations can only see their own data
CREATE POLICY "Organizations view own data"
  ON public.stripe_customers FOR SELECT
  USING (organization_id IN (
    SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
  ));
```

**Platform Admin Access:**
```sql
-- Example: Admins have full access to admin tables
CREATE POLICY "Platform admins manage subscription plans"
  ON platform_admin.subscription_plans FOR ALL
  USING (public.is_platform_admin(auth.uid()));
```

### Benefits

✅ **Logical Separation** - Different schemas provide clear boundaries
✅ **RLS Enforcement** - Database-level security prevents unauthorized access
✅ **Foreign Keys Work** - All tables in same database
✅ **ACID Transactions** - Can update across schemas atomically
✅ **Simple Deployment** - One database to manage
✅ **Lower Cost** - $25/mo (vs $50/mo for two projects)

---

## Code Usage

### Single Supabase Client

**Import:**
```typescript
import { supabase } from '@/lib/supabase';
// or
import { supabase } from '@/integrations/supabase/client';
```

**Used by ALL components:**
- Product features (firms, engagements, clients)
- Admin panel (billing, impersonation, email templates)
- Performance monitoring

**Example:**
```typescript
// Fetch from public schema
const { data: firms } = await supabase
  .from('firms')
  .select('*');

// Fetch from platform_admin schema
const { data: plans } = await supabase
  .from('subscription_plans')
  .select('*');
```

---

## Edge Functions

All edge functions are in `supabase/functions/`:

**Billing Functions:**
- `stripe-webhook`
- `create-stripe-customer`
- `create-subscription`

**Admin Functions:**
- `admin-start-impersonation`
- `admin-end-impersonation`
- `admin-log-impersonation-action`

**Communication:**
- `send-email`

**Monitoring:**
- `collect-performance-metrics`

### Deploying Edge Functions

```bash
# Deploy individual function
supabase functions deploy stripe-webhook

# Or deploy all at once
cd supabase/functions
for dir in */; do
  supabase functions deploy "${dir%/}"
done
```

### Setting Secrets

```bash
# Stripe (for billing)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set EMAIL_FROM="YourApp <noreply@yourdomain.com>"

# JWT for impersonation
supabase secrets set JWT_SECRET=$(openssl rand -base64 32)
```

---

## Migration Path (Future)

**When to split databases:** ($5M+ ARR, 50K+ organizations, or 2-3 years)

See `ARCHITECTURE_DECISION.md` for full details on when and how to split.

**Triggers:**
1. PCI DSS Level 1 required ($6M+/year card volume)
2. Database >500GB or >5K concurrent connections
3. Team size >30 engineers
4. Enterprise customers requiring separate admin infrastructure

**Effort:** 2-3 weeks of engineering time

---

## Monitoring

**Supabase Dashboard:**
- https://supabase.com/dashboard/project/qtsvdeauuawfewdzbflr

**Monitor:**
- Database size and storage
- Active connections
- Query performance
- Edge function invocations

---

## Cost

**Current Plan:** Free tier
- 500MB database storage
- 1GB file storage
- 2 CPU hours/day for edge functions

**Pro Plan:** $25/mo (when needed)
- 8GB database storage
- 100GB file storage
- Unlimited CPU hours
- Daily backups

---

## Troubleshooting

### Check which schema a table is in

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename = 'your_table_name';
```

### Verify RLS policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname IN ('public', 'platform_admin');
```

### Test admin access

```sql
-- This should return true for platform admins
SELECT public.is_platform_admin(auth.uid());
```

---

**Last Updated:** 2025-11-27
**Architecture Decision:** See `ARCHITECTURE_DECISION.md`
